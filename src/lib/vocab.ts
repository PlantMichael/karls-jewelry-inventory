/**
 * Controlled vocabulary for the inventory, derived from the category list Karl's
 * used in the old program (categories.txt).
 *
 * The old list crammed type, metal, stone, length and condition into a single
 * string, which is why it grew to ~90 entries with typos and duplicates. These
 * lists keep each fact separate, so new combinations never need a new category.
 *
 * TO ADD A NEW OPTION: add it to the relevant array below. That's the only edit
 * needed — the forms and filters read straight from here.
 */

export const KINDS = ['Item', 'Service'] as const;

/** Physical stock. */
export const ITEM_TYPES = [
	'Ring',
	'Chain',
	'Necklace',
	'Bracelet',
	'Earrings',
	'Pendant',
	'Pin',
	'Watch',
	'Pocket Watch',
	'Pearls',
	'Giftware',
	'Clock',
	'Purse',
	'Wallet',
	'Candle',
	'Kitchenware',
	'Cleaning Products'
];

/** Work and transactions — these aren't stock, so they're kept out of inventory totals. */
export const SERVICE_TYPES = ['Jewelry Repair', 'Watch Repair', 'Appraisal', 'Deposit', 'Special Order'];

/**
 * The old category list only ever said "gold" or "silver", because the program
 * forced everything into one string. Karat and colour are worth recording per
 * item, so the specific values come first and the vague ones remain as fallbacks.
 */
export const MATERIALS = [
	'10k Yellow Gold',
	'14k Yellow Gold',
	'18k Yellow Gold',
	'Yellow Gold',
	'10k White Gold',
	'14k White Gold',
	'18k White Gold',
	'White Gold',
	'14k Rose Gold',
	'18k Rose Gold',
	'Rose Gold',
	'Gold (unspecified)',
	'Gold Overlay',
	'Sterling Silver',
	'Platinum',
	'Stainless Steel',
	'Yellow Stainless Steel',
	'Leather'
];

/** Likewise: the old list lumped everything but diamonds under "gemstone". */
export const GEMSTONES = [
	'Diamond',
	'Lab-Grown Diamond',
	'Ruby',
	'Sapphire',
	'Emerald',
	'Pearl',
	'Opal',
	'Amethyst',
	'Topaz',
	'Garnet',
	'Turquoise',
	'Gemstone (other)'
];

/** Chain and necklace lengths. Every length in the old list, plus adjustable. */
export const LENGTHS = ['16"', '18"', '20"', '22"', '24"', '26"', '29"', '30"', '36"', 'Adjustable'];

export const CONDITIONS = ['New', 'Estate', 'Fine Estate', 'Private Estate', 'Costume'];

/** Types where a length makes sense — the form only offers it for these. */
export const LENGTH_TYPES = ['Chain', 'Necklace'];

export function typesFor(kind: string) {
	return kind === 'Service' ? SERVICE_TYPES : ITEM_TYPES;
}

/**
 * Options for a dropdown, guaranteed to include `current` even if it predates
 * the vocabulary — so editing an old row never silently drops its value.
 */
export function withCurrent(options: string[], current: string | null | undefined) {
	if (!current || options.includes(current)) return options;
	return [...options, current];
}
