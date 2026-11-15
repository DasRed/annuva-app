import type EntityName from '@/entity/EntityName';

/**
 * URL segment of an entity: recurringCharges → recurring-charges.
 */
export default function entityPath(name: EntityName): string {
    return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
