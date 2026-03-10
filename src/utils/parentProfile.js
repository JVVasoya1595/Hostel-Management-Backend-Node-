const normalizeRequiredText = (value, fieldName) => {
    const normalized = String(value || '').trim();
    if (!normalized) {
        throw new Error(`${fieldName} is required`);
    }

    return normalized;
};

const normalizeOptionalText = (value, fieldName) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    const normalized = String(value).trim();
    if (!normalized) {
        throw new Error(`${fieldName} cannot be empty`);
    }

    return normalized;
};

const normalizeLinkedStudentIds = ({ student_ids, student_id } = {}) => {
    if (student_ids === undefined && student_id === undefined) {
        return undefined;
    }

    const rawValues = student_ids !== undefined ? student_ids : student_id;
    const values = Array.isArray(rawValues) ? rawValues : [rawValues];

    return [...new Set(
        values
            .map((value) => String(value || '').trim())
            .filter(Boolean)
    )];
};

const normalizeEmergencyContacts = (contacts) => {
    if (contacts === undefined) {
        return undefined;
    }

    if (!Array.isArray(contacts)) {
        throw new Error('emergency_contacts must be an array');
    }

    let primaryCount = 0;
    const normalizedContacts = contacts.map((contact, index) => {
        if (!contact || typeof contact !== 'object') {
            throw new Error(`emergency_contacts[${index}] must be an object`);
        }

        const normalizedContact = {
            name: normalizeRequiredText(contact.name, `emergency_contacts[${index}].name`),
            relationship: normalizeOptionalText(contact.relationship, `emergency_contacts[${index}].relationship`) || null,
            phone: normalizeRequiredText(contact.phone, `emergency_contacts[${index}].phone`),
            email: normalizeOptionalText(contact.email, `emergency_contacts[${index}].email`),
            is_primary: Boolean(contact.is_primary),
        };

        if (normalizedContact.email) {
            normalizedContact.email = normalizedContact.email.toLowerCase();
        }

        if (normalizedContact.is_primary) {
            primaryCount += 1;
        }

        return normalizedContact;
    });

    if (primaryCount > 1) {
        throw new Error('Only one emergency contact can be marked as primary');
    }

    if (normalizedContacts.length > 0 && primaryCount === 0) {
        normalizedContacts[0].is_primary = true;
    }

    return normalizedContacts;
};

module.exports = {
    normalizeRequiredText,
    normalizeOptionalText,
    normalizeLinkedStudentIds,
    normalizeEmergencyContacts,
};
