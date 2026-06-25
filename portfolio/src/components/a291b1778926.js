export const Analytics = {
    slug: 'analytics',
    admin: {
        useAsTitle: 'eventType',
        group: 'Management',
        description: 'View website analytics and visitor statistics',
        defaultColumns: ['eventType', 'path', 'timestamp'],
        hidden: true,
    },
    access: {
        read: ({ req: { user } }) => Boolean(user),
        create: () => true, // Allow API to create
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => Boolean(user),
    },
    fields: [
        {
            name: 'eventType',
            type: 'select',
            required: true,
            options: [
                { label: 'Page View', value: 'pageview' },
                { label: 'Custom Event', value: 'event' },
            ],
            admin: {
                description: 'Type of analytics event',
            },
        },
        {
            name: 'eventName',
            type: 'text',
            admin: {
                description: 'Custom event name (for event type)',
                condition: (data) => data.eventType === 'event',
            },
        },
        {
            name: 'eventData',
            type: 'textarea',
            admin: {
                description: 'Custom event data (JSON format)',
                condition: (data) => data.eventType === 'event',
            },
        },
        {
            name: 'path',
            type: 'text',
            required: true,
            admin: {
                description: 'Page path visited',
            },
        },
        {
            name: 'origin',
            type: 'text',
            admin: {
                description: 'Origin URL',
            },
        },
        {
            name: 'sessionId',
            type: 'text',
            admin: {
                description: 'Unique session identifier',
            },
        },
        {
            name: 'deviceId',
            type: 'text',
            admin: {
                description: 'Device identifier',
            },
        },
        {
            name: 'referrer',
            type: 'text',
            admin: {
                description: 'Referrer URL',
            },
        },
        {
            name: 'userAgent',
            type: 'text',
            admin: {
                description: 'Browser user agent',
            },
        },
        {
            name: 'timestamp',
            type: 'date',
            required: true,
            admin: {
                date: {
                    displayFormat: 'MMM dd, yyyy h:mm a',
                },
            },
        },
    ],
};
