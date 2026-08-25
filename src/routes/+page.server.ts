import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { LENGTH_TYPES } from '$lib/vocab';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const jewelry = await prisma.jewelry.findMany({
		orderBy: {
			id: 'desc'
		}
	});
	return { jewelry };
};

/** Reads a form field as a trimmed string, or '' if it was missing. */
function text(data: FormData, key: string) {
	const value = data.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * Validates the shared add/edit form. On failure the raw strings come back too,
 * so the dialog can be re-rendered without the user retyping everything.
 */
function parseItem(data: FormData) {
	const kind = text(data, 'kind') || 'Item';
	const name = text(data, 'name');
	const type = text(data, 'type');
	const material = text(data, 'material');
	const gemstone = text(data, 'gemstone');
	const length = text(data, 'length');
	const condition = text(data, 'condition');
	const cost = Number(text(data, 'cost'));
	const retail = Number(text(data, 'retail'));
	const quantity = Number(text(data, 'quantity') || '1');

	const errors: Record<string, string> = {};
	if (!name) errors.name = 'Name is required';
	if (!type) errors.type = 'Type is required';
	if (!Number.isFinite(cost) || cost < 0) errors.cost = 'Cost must be 0 or more';
	if (!Number.isFinite(retail) || retail < 0) errors.retail = 'Retail must be 0 or more';
	if (!Number.isInteger(quantity) || quantity < 0) errors.quantity = 'Quantity must be a whole number';

	const values = {
		id: text(data, 'id'),
		kind,
		name,
		type,
		material,
		gemstone,
		length,
		condition,
		cost: text(data, 'cost'),
		retail: text(data, 'retail'),
		quantity: text(data, 'quantity')
	};

	if (Object.keys(errors).length > 0) return { errors, values, item: null };

	return {
		errors: null,
		values,
		item: {
			kind,
			name,
			type,
			material: material || null,
			gemstone: gemstone || null,
			// A length on a ring would be meaningless — drop it unless the type takes one.
			length: LENGTH_TYPES.includes(type) ? length || null : null,
			condition: condition || null,
			cost,
			retail,
			quantity
		}
	};
}

export const actions: Actions = {
	create: async ({ request }) => {
		const { errors, values, item } = parseItem(await request.formData());
		if (!item) return fail(400, { errors, values });

		await prisma.jewelry.create({ data: item });
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(text(data, 'id'));
		if (!Number.isInteger(id)) return fail(400, { actionError: 'Invalid item' });

		const { errors, values, item } = parseItem(data);
		if (!item) return fail(400, { errors, values });

		await prisma.jewelry.update({ where: { id }, data: item });
		return { success: true };
	},

	/** Bumps quantity by a delta, clamped at zero — used by the -/+ buttons. */
	adjust: async ({ request }) => {
		const data = await request.formData();
		const id = Number(text(data, 'id'));
		const delta = Number(text(data, 'delta'));

		if (!Number.isInteger(id) || !Number.isInteger(delta)) {
			return fail(400, { actionError: 'Invalid adjustment' });
		}

		const existing = await prisma.jewelry.findUnique({ where: { id } });
		if (!existing) return fail(404, { actionError: 'Item not found' });

		await prisma.jewelry.update({
			where: { id },
			data: { quantity: Math.max(0, existing.quantity + delta) }
		});

		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(text(data, 'id'));
		if (!Number.isInteger(id)) return fail(400, { actionError: 'Invalid item' });

		await prisma.jewelry.delete({ where: { id } });
		return { success: true };
	}
};
