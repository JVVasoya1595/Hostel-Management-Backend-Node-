module.exports = {
    version: '1.0',
    effective_from: '2026-03-10',
    policies: [
        {
            id: 'curfew-timing',
            category: 'DISCIPLINE',
            title: 'Curfew Timing',
            description: 'Students must return to the hostel by 10:00 PM unless an approved leave request is on file.',
        },
        {
            id: 'visitor-hours',
            category: 'VISITORS',
            title: 'Visitor Access',
            description: 'Visitors are allowed only during approved visiting hours and must register at the reception desk.',
        },
        {
            id: 'leave-approval',
            category: 'LEAVE',
            title: 'Leave Approval Requirement',
            description: 'Overnight or multi-day leave requires a submitted request with reason and approval before departure.',
        },
        {
            id: 'room-cleanliness',
            category: 'MAINTENANCE',
            title: 'Room Cleanliness',
            description: 'Students are responsible for maintaining basic cleanliness in their allotted room and reporting maintenance issues promptly.',
        },
        {
            id: 'fee-deadline',
            category: 'FEES',
            title: 'Fee Payment Deadline',
            description: 'Monthly hostel fees should be paid on or before the 5th day of each billing month to avoid overdue status.',
        },
        {
            id: 'emergency-protocol',
            category: 'SAFETY',
            title: 'Emergency Reporting',
            description: 'Any medical, safety, or security emergency must be reported to the hostel manager immediately.',
        },
    ],
};
