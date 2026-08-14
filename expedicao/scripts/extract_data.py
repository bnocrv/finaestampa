from __future__ import annotations

import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from zipfile import ZipFile


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
MONTH_NAMES = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
]

# Rows where the spreadsheet lists more volume groups than destinations.
# The mapping follows the transfer order recorded in the same row.
STOP_VOLUME_OVERRIDES = {
    ("2025", 124): [291, 331 + 119],
    ("2025", 147): [76 + 2, 97],
}

# Correcoes operacionais pontuais solicitadas apos a importacao da planilha.
DATE_OVERRIDES = {
    ("2026", 233): "2026-08-12",
}


def excel_date(value: str) -> str:
    date = datetime(1899, 12, 30) + timedelta(days=float(value))
    return date.strftime("%Y-%m-%d")


def normalize_text(value: str) -> str:
    value = re.sub(r"\s*\[[^\]]*\]", "", value)
    value = re.sub(r"\s*\([^)]*\)", "", value)
    value = re.sub(r"\s+", " ", value).strip(" -")
    return value


def normalize_driver_name(value: str) -> str | None:
    driver = re.sub(r"\s+", " ", value or "").strip()
    driver = re.sub(r"^D[ªA]\.?\s*", "", driver, flags=re.I)
    comparable = ascii_upper(driver).replace(".", "").replace("ª", "").replace("º", "")
    comparable = re.sub(r"\s+", " ", comparable).strip()
    driver_aliases = {
        "VALFREDO": "Sr. Valfredo",
        "VAN VALFREDO": "Sr. Valfredo",
        "M ANTONIO": "Marcos Antônio",
        "ANTONIO": "Marcos Antônio",
        "MARCOS": "Marcos Antônio",
        "SR ANDRE": "Sr. André",
        "SRO ANDRE": "Sr. André",
        "SEU ANDRE": "Sr. André",
        "VAN": "Sr. André",
        "VAN SR ANDRE": "Sr. André",
        "CLEYTON": "Cleyton Arruda",
        "FELIPE": "Felipe Advogado",
        "MONICA": "Dona Mônica",
        "JULIA": "Deivid (Genro da Mônica)",
        "DEIVID": "Deivid (Genro da Mônica)",
        "GENRO MONICA": "Deivid (Genro da Mônica)",
        "MATHEUS": "Matheus (Rocinha)",
        "CESAR": "César Luiz",
        "LALAMOOVE": "Lalamoove (Frete Extra)",
        "PAI MATHEUS": "Pai do Matheus",
        "PAI MATHEUS & VALERIA": "Pai do Matheus",
        "PAI MATHEUS & D VALERIA": "Pai do Matheus",
        "JOAO": "João (Piraí)",
        "BURREG0": "Burrego (Frete Extra)",
        "BURREGO": "Burrego (Frete Extra)",
        "BORREGO": "Burrego (Frete Extra)",
        "CAMINHAO": "Burrego (Frete Extra)",
        "TERCEIROS": "Burrego (Frete Extra)",
        "CAMINHAO TERCEIROS": "Burrego (Frete Extra)",
        "BORREGO & SEU ANDRE": "Burrego (Frete Extra)",
        "VALERIA": "Dona Valéria",
        "D VALERIA": "Dona Valéria",
        "PEDRO": "Pedro (Piraí)",
        "MILTON": "Milton (TI)",
        "ANINHA": "Aninha (Confecção)",
        "MAE JOAO": "Mãe do João (Piraí)",
        "MAO DO JOAO": "Mãe do João (Piraí)",
        "MAO JOAO": "Mãe do João (Piraí)",
        "FIORINO": "Dona Valéria",
        "FLAVIO": "Flávio (Frete Extra)",
    }
    return driver_aliases.get(comparable, driver) or None


def raw_driver_text(value: str) -> str | None:
    matches = re.findall(r"\(([^()]*)\)", value or "")
    if not matches:
        return None
    driver = matches[-1].strip()
    if "-" in driver and not re.search(r"&", driver):
        driver = driver.split("-")[-1].strip()
    return re.sub(r"\s+", " ", driver) or None


def driver_assignments(value: str, destination_count: int) -> list[dict]:
    raw_driver = raw_driver_text(value)
    if not raw_driver:
        return []
    clean_driver = re.sub(r"\bVan\s*\d*\s*-\s*", "", raw_driver, flags=re.I)
    clean_driver = re.sub(r"\bCaminh[aã]o\s*-\s*", "", clean_driver, flags=re.I)
    clean_driver = re.sub(r"\bFiorino\s*-\s*", "", clean_driver, flags=re.I)
    clean_driver = re.sub(r"\bVan\s+Sr", "Sr", clean_driver, flags=re.I)
    parts = [part.strip(" -") for part in re.split(r"\s*(?:\+|&)\s*", clean_driver) if part.strip(" -")]
    parts = [
        part
        for part in parts
        if not re.fullmatch(r"Van\s*\d+", part, flags=re.I)
    ]

    if len(parts) == 1 and ascii_upper(parts[0]).replace(".", "").replace("ª", "").replace("º", "") == "CAMINHAO E VAN":
        parts = ["CAMINHAO", "VAN"]

    names = [normalize_driver_name(part) for part in parts]
    names = [name for name in names if name]
    if not names:
        return []
    if len(names) > 1:
        return [{"driver": name, "tripCount": 1} for name in names]
    driver = normalize_driver_name(raw_driver)
    return [{"driver": driver, "tripCount": destination_count}] if driver else []


def trip_count(value: str, year: str) -> int:
    if year == "2024":
        return 1
    numbers = re.findall(r"\d+", value or "")
    return len(numbers) if numbers else 1


def ascii_upper(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFD", value.upper())
        if unicodedata.category(char) != "Mn"
    )


DESTINATION_PATTERNS = [
    (r"\bSAO JOSE DOS CAMPOS\b|\bSAO JOSE\b|\bSJC\b", "São José dos Campos"),
    (r"\bSAO VICENTE\b|\bSV\b", "São Vicente"),
    (r"\bSANTO AMARO\b|\bSA\b", "Santo Amaro"),
    (r"\bGUARULHOS\b|\bGR\b", "Guarulhos"),
    (r"\bCABO FRIO\b", "Cabo Frio"),
    (r"\bJACAREI\b|\bJCI\b", "Jacareí"),
    (r"\bROCINHA\b", "Rocinha"),
    (r"\bPIRAI\b", "Piraí"),
    (r"\bTIJUCA\b", "Tijuca"),
]


def extract_destinations(value: str) -> list[str]:
    searchable = ascii_upper(normalize_text(value))
    matches = []
    for pattern, display_name in DESTINATION_PATTERNS:
        for match in re.finditer(pattern, searchable):
            matches.append((match.start(), display_name))
    return [display_name for _, display_name in sorted(matches)]


def parse_volume_values(volume_text: str) -> list[int]:
    return [int(value) for value in re.findall(r"\d+", volume_text)]


def parse_volume_groups(volume_text: str) -> list[int]:
    normalized = re.sub(r"\s+(?:e|\$)\s+", " & ", volume_text, flags=re.I)
    groups = [group.strip() for group in normalized.split("&") if group.strip()]
    return [sum(parse_volume_values(group)) for group in groups]


def split_stops(
    year: str,
    row_number: int,
    destination: str,
    volume_text: str,
    total: int,
) -> list[dict]:
    destinations = extract_destinations(destination)
    grouped_volumes = STOP_VOLUME_OVERRIDES.get(
        (year, row_number),
        parse_volume_groups(volume_text),
    )
    individual_volumes = parse_volume_values(volume_text)

    if len(destinations) == len(grouped_volumes):
        pairs = zip(destinations, grouped_volumes)
    elif len(destinations) == len(individual_volumes):
        pairs = zip(destinations, individual_volumes)
    elif len(destinations) == 1:
        pairs = [(destinations[0], total)]
    else:
        raise ValueError(
            f"Não foi possível relacionar destinos e volumes: "
            f"aba {year}, linha {row_number}, destino={destination!r}, "
            f"volumes={volume_text!r}"
        )

    consolidated = {}
    order = []
    for destination_name, volume in pairs:
        if destination_name not in consolidated:
            consolidated[destination_name] = 0
            order.append(destination_name)
        consolidated[destination_name] += volume
    return [
        {"destination": destination_name, "volumes": consolidated[destination_name]}
        for destination_name in order
    ]


def cell_column(reference: str) -> str:
    match = re.match(r"[A-Z]+", reference)
    return match.group() if match else ""


def read_workbook(path: Path) -> tuple[list[dict], dict]:
    records = []
    seen_fingerprints = set()
    duplicate_rows = []
    raw_record_count = 0

    with ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(
            archive.read("xl/_rels/workbook.xml.rels")
        )
        targets = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationships
        }

        shared_strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_xml = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_xml:
                shared_strings.append(
                    "".join(
                        text.text or ""
                        for text in item.iter(f"{{{MAIN_NS}}}t")
                    )
                )

        sheets = workbook.find(f"{{{MAIN_NS}}}sheets")
        for sheet in sheets if sheets is not None else []:
            year = sheet.attrib["name"]
            if year not in {"2024", "2025", "2026"}:
                continue

            relationship_id = sheet.attrib[f"{{{REL_NS}}}id"]
            target = targets[relationship_id].lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"

            trip_column, date_column, destination_column, volume_column = (
                ("A", "A", "B", "C") if year == "2024" else ("A", "B", "D", "E")
            )
            sheet_xml = ET.fromstring(archive.read(target))

            for row in sheet_xml.iter(f"{{{MAIN_NS}}}row"):
                row_number = int(row.attrib["r"])
                values = {}
                for cell in row.findall(f"{{{MAIN_NS}}}c"):
                    value_node = cell.find(f"{{{MAIN_NS}}}v")
                    value = "" if value_node is None else (value_node.text or "")
                    cell_type = cell.attrib.get("t")
                    if cell_type == "s" and value:
                        value = shared_strings[int(value)]
                    elif cell_type == "inlineStr":
                        value = "".join(
                            text.text or ""
                            for text in cell.iter(f"{{{MAIN_NS}}}t")
                        )
                    values[cell_column(cell.attrib["r"])] = value.strip()

                try:
                    date = excel_date(values.get(date_column, ""))
                except (ValueError, TypeError):
                    continue
                date = DATE_OVERRIDES.get((year, row_number), date)

                destination = values.get(destination_column, "")
                volume_text = values.get(volume_column, "")
                volume_values = parse_volume_values(volume_text)
                if not destination or not volume_values:
                    continue

                raw_record_count += 1
                fingerprint = (year, tuple(sorted(values.items())))
                if fingerprint in seen_fingerprints:
                    duplicate_rows.append({"sheet": year, "row": row_number})
                    continue
                seen_fingerprints.add(fingerprint)

                total = sum(volume_values)
                trips = trip_count(values.get(trip_column, ""), year)
                stops = split_stops(
                    year,
                    row_number,
                    destination,
                    volume_text,
                    total,
                )
                destination_count = max(len(stops), 1)
                assignments = driver_assignments(destination, destination_count)
                records.append(
                    {
                        "date": date,
                        "destination": " + ".join(
                            stop["destination"] for stop in stops
                        ),
                        "volumes": total,
                        "driver": assignments[0]["driver"]
                        if len(assignments) == 1
                        else None,
                        "tripCount": trips,
                        "driverAssignments": assignments,
                        "stops": stops,
                        "source": {"sheet": year, "row": row_number},
                    }
                )

    records = sorted(records, key=lambda record: record["date"])
    monthly = defaultdict(lambda: {"trips": 0, "volumes": 0})
    for record in records:
        key = record["date"][:7]
        monthly[key]["trips"] += 1
        monthly[key]["volumes"] += record["volumes"]

    analysis_records = [
        record
        for record in records
        if not (
            record["date"].startswith("2024-08")
            or record["date"].startswith("2024-09")
        )
    ]
    audit = {
        "rawRecordCount": raw_record_count,
        "uniqueRecordCount": len(records),
        "duplicateRowsRemoved": duplicate_rows,
        "totalVolumes": sum(record["volumes"] for record in records),
        "analysisRecordCount": len(analysis_records),
        "analysisTotalVolumes": sum(
            record["volumes"] for record in analysis_records
        ),
        "analysisExcludedPeriods": ["2024-08", "2024-09"],
        "latestDate": max(record["date"] for record in records),
        "monthlyTotals": dict(sorted(monthly.items())),
        "manualStopMappings": [
            {"sheet": sheet, "row": row}
            for sheet, row in sorted(STOP_VOLUME_OVERRIDES)
        ],
    }
    return records, audit


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Uso: extract_data.py <arquivo.xlsx> <saida.js>")

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    records, audit = read_workbook(source)
    years = sorted({record["date"][:4] for record in records})
    metadata = {
        "source": source.name,
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "years": years,
        "recordCount": len(records),
        "totalVolumes": audit["totalVolumes"],
        "analysisRecordCount": audit["analysisRecordCount"],
        "analysisTotalVolumes": audit["analysisTotalVolumes"],
        "latestDate": audit["latestDate"],
        "sourceModifiedAt": datetime.fromtimestamp(
            source.stat().st_mtime
        ).astimezone().isoformat(timespec="seconds"),
        "audit": {
            "rawRecordCount": audit["rawRecordCount"],
            "duplicateRowsRemoved": len(audit["duplicateRowsRemoved"]),
            "analysisExcludedPeriods": audit["analysisExcludedPeriods"],
        },
        "monthNames": MONTH_NAMES,
    }
    content = (
        "window.EXPEDITION_DATA = "
        + json.dumps(
            {"metadata": metadata, "records": records},
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + ";\n"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    audit_output = output.with_name("audit.json")
    audit_output.write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{len(records)} registros gravados em {output}")
    print(f"Auditoria gravada em {audit_output}")


if __name__ == "__main__":
    main()
