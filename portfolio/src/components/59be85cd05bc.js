export const Users = {
    slug: 'users',
    admin: {
        useAsTitle: 'name',
        hidden: true, // Hide Users collection from admin navigation
    },
    auth: true,
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                description: 'Full name to display as author',
            },
        },
        // Email added by default
    ],
};
