export function formatTierPrice(tier) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: tier.currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(tier.priceCents / 100);
}
