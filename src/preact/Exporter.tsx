import { useRef, useState } from "preact/hooks";

const today = new Date().toISOString().slice(0, 10);
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
	.toISOString()
	.slice(0, 10);

export default function Exporter() {
	const [loading, setLoading] = useState(false);
	const dataRef = useRef<any[]>([]);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const from = (form.querySelector("#from") as HTMLInputElement).value;
		const to = (form.querySelector("#to") as HTMLInputElement).value;
		const maximumVal = (form.querySelector("#maximum") as HTMLInputElement)
			.value;

		const params = new URLSearchParams({ from });
		if (to) params.set("to", to);
		if (maximumVal) params.set("maximum", maximumVal);

		setLoading(true);
		const resp = await fetch(`/api/list?${params}`);
		dataRef.current = await resp.json();
		setLoading(false);
	}

	return (
		<>
			<h1>Exporter</h1>
			<form onSubmit={handleSubmit} className=" grid grid-cols-2 gap-4">
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
					<input id="maximum" type="number" min={1} />
				</div>
				<div></div>
				<button type="submit" disabled={loading}>
					{loading ? "Fetching…" : "Export"}
				</button>
			</form>
		</>
	);
}
