<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		CONDITIONS,
		GEMSTONES,
		KINDS,
		LENGTHS,
		LENGTH_TYPES,
		MATERIALS,
		typesFor,
		withCurrent
	} from '$lib/vocab';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Item = PageProps['data']['jewelry'][number];
	type SortKey = 'name' | 'type' | 'material' | 'gemstone' | 'length' | 'condition' | 'cost' | 'retail' | 'margin' | 'quantity';

	const COLUMNS: { key: SortKey; label: string; num?: boolean }[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'type', label: 'Type' },
		{ key: 'material', label: 'Material' },
		{ key: 'gemstone', label: 'Stone' },
		{ key: 'length', label: 'Length' },
		{ key: 'condition', label: 'Condition' },
		{ key: 'cost', label: 'Cost', num: true },
		{ key: 'retail', label: 'Retail', num: true },
		{ key: 'margin', label: 'Margin', num: true },
		{ key: 'quantity', label: 'Qty', num: true }
	];

	const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
	const blank = {
		id: '',
		kind: 'Item',
		name: '',
		type: '',
		material: '',
		gemstone: '',
		length: '',
		condition: 'New',
		cost: '',
		retail: '',
		quantity: '1'
	};

	let dialog = $state<HTMLDialogElement>();
	let query = $state('');
	let filters = $state({ kind: '', type: '', material: '', gemstone: '', condition: '' });
	// null means "no column chosen" — rows stay in newest-first order from the server.
	let sortKey = $state<SortKey | null>(null);
	let sortAsc = $state(true);
	let draft = $state({ ...blank });
	let errors = $state<Record<string, string>>({});

	const editing = $derived(draft.id !== '');
	const isItem = $derived(draft.kind !== 'Service');
	const takesLength = $derived(LENGTH_TYPES.includes(draft.type));
	const activeFilters = $derived(Object.values(filters).filter(Boolean).length + (query ? 1 : 0));

	/** Only offer a filter value if something in the inventory actually has it. */
	function present(key: 'type' | 'material' | 'gemstone' | 'condition') {
		return [...new Set(data.jewelry.map((i) => i[key]).filter(Boolean))].sort() as string[];
	}

	function sortValue(item: Item, key: SortKey) {
		if (key === 'margin') return item.retail - item.cost;
		return item[key] ?? '';
	}

	const rows = $derived.by(() => {
		const q = query.trim().toLowerCase();

		let list = data.jewelry.filter((item) => {
			if (filters.kind && item.kind !== filters.kind) return false;
			if (filters.type && item.type !== filters.type) return false;
			if (filters.material && item.material !== filters.material) return false;
			if (filters.gemstone && item.gemstone !== filters.gemstone) return false;
			if (filters.condition && item.condition !== filters.condition) return false;
			if (!q) return true;
			return [item.name, item.type, item.material, item.gemstone, item.length, item.condition]
				.some((field) => (field ?? '').toLowerCase().includes(q));
		});

		if (sortKey) {
			const key = sortKey;
			const dir = sortAsc ? 1 : -1;
			list = [...list].sort((a, b) => {
				const x = sortValue(a, key);
				const y = sortValue(b, key);
				if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
				return String(x).localeCompare(String(y), undefined, { sensitivity: 'base' }) * dir;
			});
		}

		return list;
	});

	// Services are work, not stock — they'd inflate every figure if counted.
	const stock = $derived(rows.filter((item) => item.kind === 'Item'));
	const serviceCount = $derived(rows.length - stock.length);

	const totals = $derived({
		pieces: stock.reduce((sum, item) => sum + item.quantity, 0),
		cost: stock.reduce((sum, item) => sum + item.cost * item.quantity, 0),
		retail: stock.reduce((sum, item) => sum + item.retail * item.quantity, 0)
	});

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	function clearFilters() {
		filters = { kind: '', type: '', material: '', gemstone: '', condition: '' };
		query = '';
	}

	/** Switching Item/Service changes which types are valid, so drop a stale one. */
	function onKindChange() {
		if (draft.type && !typesFor(draft.kind).includes(draft.type)) draft.type = '';
	}

	function openAdd() {
		draft = { ...blank };
		errors = {};
		dialog?.showModal();
	}

	function openEdit(item: Item) {
		draft = {
			id: String(item.id),
			kind: item.kind,
			name: item.name,
			type: item.type,
			material: item.material ?? '',
			gemstone: item.gemstone ?? '',
			length: item.length ?? '',
			condition: item.condition ?? '',
			cost: String(item.cost),
			retail: String(item.retail),
			quantity: String(item.quantity)
		};
		errors = {};
		dialog?.showModal();
	}

	/** Keeps the dialog open and shows messages when the server rejects a save. */
	const saveHandler = () => async ({ result, update }: { result: any; update: any }) => {
		await update({ reset: false });
		errors = result.type === 'failure' ? (result.data?.errors ?? {}) : {};
		if (result.type === 'success') dialog?.close();
	};
</script>

<svelte:head>
	<title>Karl's Jewelry — Inventory</title>
</svelte:head>

<main>
	<header>
		<div>
			<h1>Inventory</h1>
			<p class="sub">
				{#if activeFilters}
					{rows.length} of {data.jewelry.length} shown
				{:else}
					{data.jewelry.length} record{data.jewelry.length === 1 ? '' : 's'} · {totals.pieces} piece{totals.pieces === 1 ? '' : 's'} in stock
				{/if}
			</p>
		</div>
		<button class="primary" onclick={openAdd}>+ Add item</button>
	</header>

	<div class="filters">
		<div class="search">
			<input type="search" placeholder="Search anything…" bind:value={query} />
			{#if query}
				<button class="clear" onclick={() => (query = '')} title="Clear search">×</button>
			{/if}
		</div>

		<select bind:value={filters.kind} class:set={filters.kind}>
			<option value="">All records</option>
			{#each KINDS as k}<option value={k}>{k === 'Item' ? 'Stock only' : 'Services only'}</option>{/each}
		</select>

		<select bind:value={filters.type} class:set={filters.type}>
			<option value="">Any type</option>
			{#each present('type') as v}<option value={v}>{v}</option>{/each}
		</select>

		<select bind:value={filters.material} class:set={filters.material}>
			<option value="">Any material</option>
			{#each present('material') as v}<option value={v}>{v}</option>{/each}
		</select>

		<select bind:value={filters.gemstone} class:set={filters.gemstone}>
			<option value="">Any stone</option>
			{#each present('gemstone') as v}<option value={v}>{v}</option>{/each}
		</select>

		<select bind:value={filters.condition} class:set={filters.condition}>
			<option value="">Any condition</option>
			{#each present('condition') as v}<option value={v}>{v}</option>{/each}
		</select>

		{#if activeFilters}
			<button class="clear-all" onclick={clearFilters}>Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}</button>
		{/if}
	</div>

	{#if data.jewelry.length === 0}
		<div class="empty">
			<p>No items in inventory yet.</p>
			<button class="primary" onclick={openAdd}>Add the first item</button>
		</div>
	{:else if rows.length === 0}
		<div class="empty">
			<p>Nothing matches those filters.</p>
			<button onclick={clearFilters}>Clear filters</button>
		</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						{#each COLUMNS as col}
							<th class:num={col.num} aria-sort={sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
								<button class="sort" onclick={() => toggleSort(col.key)}>
									{col.label}<span class="arrow">{sortKey === col.key ? (sortAsc ? '↑' : '↓') : ''}</span>
								</button>
							</th>
						{/each}
						<th aria-label="Actions"></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as item (item.id)}
						<tr class:service={item.kind === 'Service'}>
							<td class="name">
								<button class="link" onclick={() => openEdit(item)} title="Edit {item.name}">{item.name}</button>
								{#if item.kind === 'Service'}<span class="badge">Service</span>{/if}
							</td>
							<td>{item.type}</td>
							<td class:muted={!item.material}>{item.material ?? '—'}</td>
							<td class:muted={!item.gemstone}>{item.gemstone ?? '—'}</td>
							<td class:muted={!item.length}>{item.length ?? '—'}</td>
							<td class:muted={!item.condition}>{item.condition ?? '—'}</td>
							<td class="num">{money.format(item.cost)}</td>
							<td class="num">{money.format(item.retail)}</td>
							<td class="num" class:loss={item.retail < item.cost}>{money.format(item.retail - item.cost)}</td>
							<td class="num">
								<div class="qty">
									<form method="POST" action="?/adjust" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="delta" value="-1" />
										<button class="step" disabled={item.quantity === 0} title="One sold — decrease {item.name}">−</button>
									</form>
									<span class="count" class:zero={item.quantity === 0}>{item.quantity}</span>
									<form method="POST" action="?/adjust" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="delta" value="1" />
										<button class="step" title="Increase {item.name}">+</button>
									</form>
								</div>
							</td>
							<td class="num">
								<div class="actions">
									<button class="icon" onclick={() => openEdit(item)} title="Edit {item.name}">Edit</button>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm(`Delete "${item.name}"?`)) e.preventDefault();
										}}
									>
										<input type="hidden" name="id" value={item.id} />
										<button class="delete" title="Delete {item.name}">×</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="6">
							{activeFilters ? 'Matching stock' : 'Inventory total'}
							{#if serviceCount}<span class="note">({serviceCount} service{serviceCount === 1 ? '' : 's'} not counted)</span>{/if}
						</td>
						<td class="num">{money.format(totals.cost)}</td>
						<td class="num">{money.format(totals.retail)}</td>
						<td class="num">{money.format(totals.retail - totals.cost)}</td>
						<td class="num">{totals.pieces}</td>
						<td></td>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</main>

<dialog bind:this={dialog}>
	<form method="POST" action={editing ? '?/update' : '?/create'} use:enhance={saveHandler}>
		<h2>{editing ? 'Edit' : 'Add'} {draft.kind === 'Service' ? 'service' : 'item'}</h2>

		{#if editing}<input type="hidden" name="id" value={draft.id} />{/if}

		<div class="kinds">
			{#each KINDS as k}
				<label class="radio" class:on={draft.kind === k}>
					<input type="radio" name="kind" value={k} bind:group={draft.kind} onchange={onKindChange} />
					{k === 'Item' ? 'Stock item' : 'Service / repair'}
				</label>
			{/each}
		</div>

		<label>
			Name
			<input name="name" bind:value={draft.name} required autocomplete="off" placeholder="e.g. Solitaire engagement ring" />
			{#if errors.name}<span class="err">{errors.name}</span>{/if}
		</label>

		<div class="row">
			<label>
				Type
				<select name="type" bind:value={draft.type} required>
					<option value="" disabled>Choose…</option>
					{#each withCurrent(typesFor(draft.kind), draft.type) as v}<option value={v}>{v}</option>{/each}
				</select>
				{#if errors.type}<span class="err">{errors.type}</span>{/if}
			</label>

			{#if isItem}
				<label>
					Condition
					<select name="condition" bind:value={draft.condition}>
						<option value="">—</option>
						{#each withCurrent(CONDITIONS, draft.condition) as v}<option value={v}>{v}</option>{/each}
					</select>
				</label>
			{/if}
		</div>

		<!-- Metal, stone and length describe a physical piece — meaningless on a repair. -->
		{#if isItem}
			<div class="row">
				<label>
					Material
					<select name="material" bind:value={draft.material}>
						<option value="">—</option>
						{#each withCurrent(MATERIALS, draft.material) as v}<option value={v}>{v}</option>{/each}
					</select>
				</label>

				<label>
					Stone
					<select name="gemstone" bind:value={draft.gemstone}>
						<option value="">—</option>
						{#each withCurrent(GEMSTONES, draft.gemstone) as v}<option value={v}>{v}</option>{/each}
					</select>
				</label>

				{#if takesLength}
					<label>
						Length
						<select name="length" bind:value={draft.length}>
							<option value="">—</option>
							{#each withCurrent(LENGTHS, draft.length) as v}<option value={v}>{v}</option>{/each}
						</select>
					</label>
				{/if}
			</div>
		{/if}

		<div class="row">
			<label>
				Cost
				<input name="cost" type="number" step="0.01" min="0" bind:value={draft.cost} required />
				{#if errors.cost}<span class="err">{errors.cost}</span>{/if}
			</label>

			<label>
				Retail
				<input name="retail" type="number" step="0.01" min="0" bind:value={draft.retail} required />
				{#if errors.retail}<span class="err">{errors.retail}</span>{/if}
			</label>

			<label>
				Qty
				<input name="quantity" type="number" step="1" min="0" bind:value={draft.quantity} required />
				{#if errors.quantity}<span class="err">{errors.quantity}</span>{/if}
			</label>
		</div>

		<footer>
			<button type="button" onclick={() => dialog?.close()}>Cancel</button>
			<button class="primary">{editing ? 'Save changes' : 'Save'}</button>
		</footer>
	</form>
</dialog>

<style>
	:global(body) {
		margin: 0;
		background: #f6f5f3;
		color: #1c1917;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
	}

	main {
		max-width: 1320px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.1rem;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		letter-spacing: -0.02em;
	}

	.sub {
		margin: 0.25rem 0 0;
		color: #78716c;
		font-size: 0.875rem;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}

	.search {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search input {
		width: 16rem;
		padding-right: 2rem;
	}

	.clear {
		position: absolute;
		right: 0.3rem;
		border: none;
		background: none;
		padding: 0.1rem 0.35rem;
		color: #a8a29e;
		font-size: 1.1rem;
		line-height: 1;
	}

	.clear:hover {
		background: none;
		color: #1c1917;
	}

	.filters select {
		color: #78716c;
	}

	.filters select.set {
		color: #1c1917;
		border-color: #1c1917;
		font-weight: 500;
	}

	.clear-all {
		border-style: dashed;
		color: #78716c;
	}

	button {
		font: inherit;
		font-size: 0.875rem;
		padding: 0.55rem 1rem;
		border: 1px solid #d6d3d1;
		border-radius: 8px;
		background: #fff;
		color: #1c1917;
		cursor: pointer;
	}

	button:hover {
		background: #f5f5f4;
	}

	button.primary {
		background: #1c1917;
		border-color: #1c1917;
		color: #fff;
		font-weight: 500;
		white-space: nowrap;
	}

	button.primary:hover {
		background: #44403c;
	}

	.empty {
		background: #fff;
		border: 1px solid #e7e5e4;
		border-radius: 12px;
		padding: 3.5rem 1.5rem;
		text-align: center;
		color: #78716c;
	}

	.table-wrap {
		background: #fff;
		border: 1px solid #e7e5e4;
		border-radius: 12px;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	th,
	td {
		padding: 0.7rem 0.9rem;
		text-align: left;
		border-bottom: 1px solid #f0efed;
	}

	thead th {
		background: #fafaf9;
		padding: 0;
	}

	th.num .sort {
		justify-content: flex-end;
	}

	.sort {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
		border: none;
		border-radius: 0;
		background: none;
		padding: 0.6rem 0.9rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #78716c;
		font-weight: 600;
	}

	.sort:hover {
		background: #f0efed;
		color: #1c1917;
	}

	.arrow {
		display: inline-block;
		min-width: 0.6em;
		font-size: 0.9em;
	}

	tbody tr:hover {
		background: #fafaf9;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tr.service td {
		background: #fdfcfa;
	}

	.badge {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.4rem;
		border-radius: 20px;
		background: #f0efed;
		color: #78716c;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.name {
		font-weight: 500;
	}

	.link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-weight: 500;
		color: #1c1917;
		text-align: left;
	}

	.link:hover {
		background: none;
		text-decoration: underline;
	}

	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.muted {
		color: #d6d3d1;
	}

	.loss {
		color: #b91c1c;
	}

	.note {
		color: #a8a29e;
		font-weight: 400;
		font-size: 0.8125rem;
	}

	.qty {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.15rem;
	}

	.count {
		min-width: 1.5rem;
		text-align: center;
	}

	.count.zero {
		color: #b91c1c;
		font-weight: 600;
	}

	.step {
		padding: 0.05rem 0.4rem;
		border-radius: 6px;
		font-size: 0.9rem;
		line-height: 1.3;
		color: #78716c;
		opacity: 0;
	}

	tbody tr:hover .step {
		opacity: 1;
	}

	.step:disabled {
		color: #e7e5e4;
		cursor: not-allowed;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
	}

	.icon {
		padding: 0.15rem 0.5rem;
		font-size: 0.75rem;
		color: #78716c;
		opacity: 0;
	}

	tbody tr:hover .icon {
		opacity: 1;
	}

	.delete {
		padding: 0.1rem 0.45rem;
		border: none;
		background: none;
		color: #d6d3d1;
		font-size: 1.1rem;
		line-height: 1;
	}

	.delete:hover {
		background: #fef2f2;
		color: #b91c1c;
	}

	tfoot td {
		border-top: 1px solid #e7e5e4;
		border-bottom: none;
		background: #fafaf9;
		font-weight: 600;
	}

	dialog {
		border: none;
		border-radius: 14px;
		padding: 0;
		width: min(560px, calc(100vw - 2rem));
		box-shadow: 0 20px 50px rgb(0 0 0 / 0.2);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.4);
	}

	dialog form {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.kinds {
		display: flex;
		gap: 0.5rem;
	}

	.radio {
		flex: 1;
		flex-direction: row;
		align-items: center;
		gap: 0.45rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d6d3d1;
		border-radius: 8px;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.radio.on {
		border-color: #1c1917;
		background: #fafaf9;
	}

	.radio input {
		width: auto;
		margin: 0;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #44403c;
		flex: 1;
		min-width: 0;
	}

	input,
	select {
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 400;
		color: #1c1917;
		padding: 0.5rem 0.65rem;
		border: 1px solid #d6d3d1;
		border-radius: 8px;
		background: #fff;
		width: 100%;
		box-sizing: border-box;
	}

	.filters select {
		font-size: 0.875rem;
		padding: 0.55rem 0.6rem;
		width: auto;
	}

	input:focus,
	select:focus {
		outline: 2px solid #1c1917;
		outline-offset: -1px;
		border-color: transparent;
	}

	input::placeholder {
		color: #d6d3d1;
	}

	.row {
		display: flex;
		gap: 0.75rem;
	}

	.err {
		color: #b91c1c;
		font-weight: 400;
		font-size: 0.75rem;
	}

	dialog footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
</style>
