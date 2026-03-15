import { useState } from "preact/hooks";
import { type Note } from "../db/schema";
import { regHabits } from "../lib/regex";

const today = new Date().toISOString().slice(0, 10);
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
	.toISOString()
	.slice(0, 10);

function getHabits(note: Note): { name: string; full: string }[] {
	return [...note.text.matchAll(regHabits)].map((m) => ({
		name: m[1],
		full: m[1] + m[2],
	}));
}

function buildCells(note: Note, columns: string[], excluded: Set<string>): string[] {
	const habits = getHabits(note).filter((h) => !excluded.has(h.name.toLowerCase()));
	const assigned = new Set<string>();

	const dow = ["su", "mo", "tu", "we", "th", "fr", "sa"][
		new Date(note.date + "T12:00:00").getDay()
	];
	const cells: string[] = [note.date, dow];

	for (const col of columns) {
		const wanted = col
			.split(",")
			.map((h) => h.trim().toLowerCase())
			.filter(Boolean);
		const matching = habits.filter((h) =>
			wanted.includes(h.name.toLowerCase()),
		);
		matching.forEach((h) => assigned.add(h.name));
		cells.push(matching.map((h) => h.full).join(","));
	}

	// rest column — habits not claimed by any column
	cells.push(
		habits
			.filter((h) => !assigned.has(h.name))
			.map((h) => h.full)
			.join(","),
	);

	return cells;
}

export default function Exporter() {
	const [loading, setLoading] = useState(false);
	const [list, setList] = useState<Note[] | null>(null);
	const [filter, setFilter] = useState("");
	const [columns, setColumns] = useState<string[]>([]);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		setLoading(true);
		const form = e.target as HTMLFormElement;
		const from = (form.querySelector("#from") as HTMLInputElement).value;
		const to = (form.querySelector("#to") as HTMLInputElement).value;
		const maximumVal = (form.querySelector("#maximum") as HTMLInputElement)
			.value;

		const params = new URLSearchParams({ from });
		if (to) params.set("to", to);
		if (maximumVal) params.set("maximum", maximumVal);

		const resp = await fetch(`/api/export?${params}`);
		setList(await resp.json());
		setLoading(false);
	}

	const allHabits = list
		? Array.from(
				new Set(
					list.flatMap((note) =>
						[...note.text.matchAll(regHabits)].map((m) => m[1]),
					),
				),
			).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		: [];

	const excluded = new Set(
		filter
			.split(",")
			.map((h) => h.trim().toLowerCase())
			.filter(Boolean),
	);

	const csvText = (list ?? [])
		.map((note) => buildCells(note, columns, excluded).join(";"))
		.join("\n");

	function downloadCsv() {
		const blob = new Blob([csvText], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "export.csv";
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<>
			<h1>Exporter</h1>
			{!list ? (
				<form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
					<div className="flex flex-col">
						<label htmlFor="from">From*</label>
						<input id="from" type="date" defaultValue={today} required />
					</div>
					<div className="flex flex-col">
						<label htmlFor="to">To</label>
						<input id="to" type="date" defaultValue={twoWeeksAgo} />
					</div>
					<div className="flex flex-col">
						<label htmlFor="maximum">Maximum</label>
						<input id="maximum" type="number" min={1} step={1} />
					</div>
					<div></div>
					<button type="submit" disabled={loading}>
						Export
					</button>
				</form>
			) : (
				<>
					<button
						onClick={() => {
							setList(null);
							setFilter("");
						}}
					>
						Clear
					</button>
					<div className="flex gap-2 mb-4">
						<h3>Filter habits</h3>
						<input
							type="text"
							placeholder="Filter..."
							value={filter}
							onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
							className="flex-1"
						/>
					</div>

					<h2>All habits</h2>
					{allHabits.length > 0 && (
						<div className="flex flex-wrap gap-3 mb-4">
							{allHabits.map((name) => {
								const isExcluded = excluded.has(name.toLowerCase());
								return (
									<span
										key={name}
										onClick={() => {
											const parts = filter
												.split(",")
												.map((h) => h.trim())
												.filter(Boolean);
											if (parts.some((p) => p.toLowerCase() === name.toLowerCase())) {
												setFilter(parts.filter((p) => p.toLowerCase() !== name.toLowerCase()).join(", "));
											} else {
												setFilter(parts.length ? parts.join(", ") + ", " + name : name);
											}
										}}
										className={`cursor-pointer ${isExcluded ? "line-through opacity-40" : ""}`}
									>
										{name}
									</span>
								);
							})}
						</div>
					)}

					<div className="mb-4">
						<div className="flex items-center gap-2 mb-2">
							<h2 className="m-0">Columns</h2>
						</div>
						{columns.map((col, i) => (
							<div key={i} className="flex items-center gap-2 mb-1">
								<label className="shrink-0 text-sm w-20">Column {i + 1}</label>
								<input
									type="text"
									placeholder="habit1, habit2, ..."
									value={col}
									onInput={(e) => {
										const next = [...columns];
										next[i] = (e.target as HTMLInputElement).value;
										setColumns(next);
									}}
									className="flex-1"
								/>
								<button
									onClick={() => setColumns(columns.filter((_, j) => j !== i))}
								>
									×
								</button>
							</div>
						))}
						<button onClick={() => setColumns([...columns, ""])}>
							+ Add column
						</button>
					</div>

					<div className="flex items-center justify-between mb-2">
						<h2 className="m-0">Preview</h2>
						<button onClick={downloadCsv}>Download CSV</button>
					</div>
					<table className="font-mono text-sm border-collapse">
						<tbody>
							{(list ?? []).map((note) => (
								<tr key={note.id}>
									{buildCells(note, columns, excluded).map((cell, i) => (
										<td key={i} className="border border-white/20 px-2 py-0.5">
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
			<div className="x">{loading && <span>Loading...</span>}</div>
		</>
	);
}
