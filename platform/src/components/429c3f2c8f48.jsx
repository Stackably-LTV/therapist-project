import { listPublicTherapists } from '@/components/0a3968f8c351';
import { Marketplace } from '@/components/0e72ad9d078f';
export default async function MarketplacePage() {
    const rows = await listPublicTherapists();
    const therapists = rows.map((p) => ({
        id: p.id,
        name: p.full_name,
        profile_json: {
            bio: p.bio,
            profile_image_url: p.profile_image_url,
            specialties: p.specialties,
            rate: p.rate,
            license_number: p.license_number,
        },
    }));
    return <Marketplace therapists={therapists}/>;
}
