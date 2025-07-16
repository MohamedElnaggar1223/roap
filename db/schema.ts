import { pgTable, uniqueIndex, index, bigint, varchar, boolean, timestamp, unique, foreignKey, date, time, doublePrecision, text, integer, check, uuid, pgEnum, jsonb, inet } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm/relations";

export const athleticType = pgEnum("athletic_type", ['primary', 'fellow'])
export const blockScope = pgEnum("block_scope", ['all', 'specific'])
export const discountType = pgEnum("discount_type", ['fixed', 'percentage'])
export const status = pgEnum("status", ['pending', 'accepted', 'rejected'])
export const userRoles = pgEnum("user_roles", ['admin', 'user', 'academic'])


export const users = pgTable("users", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    name: varchar({ length: 255 }).default(sql`NULL`),
    email: varchar({ length: 255 }).default(sql`NULL`),
    phoneNumber: varchar("phone_number", { length: 255 }).default(sql`NULL`),
    googleId: varchar("google_id", { length: 255 }).default(sql`NULL`),
    appleId: varchar("apple_id", { length: 255 }).default(sql`NULL`),
    isAthletic: boolean("is_athletic").default(false).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
    password: varchar({ length: 255 }).default(sql`NULL`),
    rememberToken: varchar("remember_token", { length: 100 }).default(sql`NULL`),
    deviceToken: varchar("device_token", { length: 400 }).default(sql`NULL`),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    stripeId: varchar("stripe_id", { length: 255 }).default(sql`NULL`),
    pmType: varchar("pm_type", { length: 255 }).default(sql`NULL`),
    pmLastFour: varchar("pm_last_four", { length: 4 }).default(sql`NULL`),
    trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
    deletedAt: timestamp("deleted_at", { mode: 'string' }),
    role: userRoles().default('user'),
}, (table) => {
    return {
        emailUnique: uniqueIndex("users_email_unique").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`(email IS NOT NULL)`),
        phoneNumberUnique: uniqueIndex("users_phone_number_unique").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")).where(sql`(phone_number IS NOT NULL)`),
        stripeIdIdx: index().using("btree", table.stripeId.asc().nullsLast().op("text_ops")),
    }
});

export const joinUs = pgTable("join_us", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "join_us_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        joinUsPhoneEmailUnique: unique("join_us_phone_email_unique").on(table.email, table.phone),
    }
});

export const profiles = pgTable("profiles", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "profiles_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    name: varchar({ length: 255 }).notNull(),
    gender: varchar({ length: 255 }).default(sql`NULL`),
    birthday: date(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint("user_id", { mode: "number" }).notNull(),
    image: varchar({ length: 255 }).default(sql`NULL`),
    relationship: varchar({ length: 255 }).default('self').notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    country: varchar({ length: 255 }).default(sql`NULL`),
    nationality: varchar({ length: 255 }).default(sql`NULL`),
    city: varchar({ length: 255 }).default(sql`NULL`),
    streetAddress: varchar("street_address", { length: 512 }).default(sql`NULL`),
}, (table) => {
    return {
        userIdNameUnique: uniqueIndex("profiles_user_id_name_unique").using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.name.asc().nullsLast().op("int8_ops")),
        profilesUserIdForeign: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "profiles_user_id_foreign"
        }),
    }
});

export const blocks = pgTable("blocks", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "blocks_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }).notNull(),
    date: date().notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    branchScope: blockScope("branch_scope").default('all'),
    sportScope: blockScope("sport_scope").default('all'),
    packageScope: blockScope("package_scope").default('all'),
    programScope: blockScope("program_scope").default('all'),
    note: varchar({ length: 255 }).default(sql`NULL`),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        blocksAcademicIdFkey: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "blocks_academic_id_fkey"
        }).onDelete("cascade"),
    }
});

export const spokenLanguages = pgTable("spoken_languages", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "spoken_languages_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const spokenLanguageTranslations = pgTable("spoken_language_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "spoken_language_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        spokenLanguageIdLocaleUnique: uniqueIndex("spoken_language_translations_spoken_language_id_locale_unique").using("btree", table.spokenLanguageId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        spokenLanguageTranslationsSpokenLanguageIdForeign: foreignKey({
            columns: [table.spokenLanguageId],
            foreignColumns: [spokenLanguages.id],
            name: "spoken_language_translations_spoken_language_id_foreign"
        }).onDelete("cascade"),
    }
});

export const blockBranches = pgTable("block_branches", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "block_branches_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    blockId: bigint("block_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    branchId: bigint("branch_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        idxBlockBranchesBlockId: index("idx_block_branches_block_id").using("btree", table.blockId.asc().nullsLast().op("int8_ops")),
        idxBlockBranchesBranchId: index("idx_block_branches_branch_id").using("btree", table.branchId.asc().nullsLast().op("int8_ops")),
        blockBranchesBlockIdFkey: foreignKey({
            columns: [table.blockId],
            foreignColumns: [blocks.id],
            name: "block_branches_block_id_fkey"
        }).onDelete("cascade"),
        blockBranchesBranchIdFkey: foreignKey({
            columns: [table.branchId],
            foreignColumns: [branches.id],
            name: "block_branches_branch_id_fkey"
        }).onDelete("cascade"),
        blockBranchesBlockIdBranchIdKey: unique("block_branches_block_id_branch_id_key").on(table.blockId, table.branchId),
    }
});

export const countries = pgTable("countries", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "countries_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const countryTranslations = pgTable("country_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "country_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    countryId: bigint("country_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        countryIdLocaleUnique: uniqueIndex("country_translations_country_id_locale_unique").using("btree", table.countryId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        countryTranslationsCountryIdForeign: foreignKey({
            columns: [table.countryId],
            foreignColumns: [countries.id],
            name: "country_translations_country_id_foreign"
        }).onDelete("cascade"),
    }
});

export const states = pgTable("states", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "states_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    countryId: bigint("country_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        statesCountryIdForeign: foreignKey({
            columns: [table.countryId],
            foreignColumns: [countries.id],
            name: "states_country_id_foreign"
        }).onDelete("cascade"),
    }
});

export const stateTranslations = pgTable("state_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "state_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    stateId: bigint("state_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        stateIdLocaleUnique: uniqueIndex("state_translations_state_id_locale_unique").using("btree", table.stateId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        stateTranslationsStateIdForeign: foreignKey({
            columns: [table.stateId],
            foreignColumns: [states.id],
            name: "state_translations_state_id_foreign"
        }).onDelete("cascade"),
    }
});

export const cities = pgTable("cities", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "cities_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    stateId: bigint("state_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        citiesStateIdForeign: foreignKey({
            columns: [table.stateId],
            foreignColumns: [states.id],
            name: "cities_state_id_foreign"
        }).onDelete("cascade"),
    }
});

export const cityTranslations = pgTable("city_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "city_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    cityId: bigint("city_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        cityIdLocaleUnique: uniqueIndex("city_translations_city_id_locale_unique").using("btree", table.cityId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        cityTranslationsCityIdForeign: foreignKey({
            columns: [table.cityId],
            foreignColumns: [cities.id],
            name: "city_translations_city_id_foreign"
        }).onDelete("cascade"),
    }
});

export const addresses = pgTable("addresses", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "addresses_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    streetAddress: varchar("street_address", { length: 255 }).notNull(),
    postalCode: varchar("postal_code", { length: 255 }).default(sql`NULL`),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    cityId: bigint("city_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint("user_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        userIdUnique: uniqueIndex("addresses_user_id_unique").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
        addressesCityIdForeign: foreignKey({
            columns: [table.cityId],
            foreignColumns: [cities.id],
            name: "addresses_city_id_foreign"
        }),
        addressesUserIdForeign: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "addresses_user_id_foreign"
        }).onDelete("cascade"),
    }
});

export const facilities = pgTable("facilities", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "facilities_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const facilityTranslations = pgTable("facility_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "facility_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    facilityId: bigint("facility_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        facilityIdLocaleUnique: uniqueIndex("facility_translations_facility_id_locale_unique").using("btree", table.facilityId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        facilityTranslationsFacilityIdForeign: foreignKey({
            columns: [table.facilityId],
            foreignColumns: [facilities.id],
            name: "facility_translations_facility_id_foreign"
        }).onDelete("cascade"),
    }
});

export const genders = pgTable("genders", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "genders_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const genderTranslations = pgTable("gender_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "gender_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    genderId: bigint("gender_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        genderIdLocaleUnique: uniqueIndex("gender_translations_gender_id_locale_unique").using("btree", table.genderId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        genderTranslationsGenderIdForeign: foreignKey({
            columns: [table.genderId],
            foreignColumns: [genders.id],
            name: "gender_translations_gender_id_foreign"
        }).onDelete("cascade"),
    }
});

export const sports = pgTable("sports", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sports_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    slug: varchar({ length: 255 }).default(sql`NULL`),
    image: varchar({ length: 255 }).default(sql`NULL`),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        slugUnique: uniqueIndex("sports_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(slug IS NOT NULL)`),
    }
});

export const sportTranslations = pgTable("sport_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sport_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    sportId: bigint("sport_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        sportIdLocaleUnique: uniqueIndex("sport_translations_sport_id_locale_unique").using("btree", table.sportId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        sportTranslationsSportIdForeign: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "sport_translations_sport_id_foreign"
        }).onDelete("cascade"),
    }
});

export const blockSports = pgTable("block_sports", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "block_sports_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    blockId: bigint("block_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    sportId: bigint("sport_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        idxBlockSportsBlockId: index("idx_block_sports_block_id").using("btree", table.blockId.asc().nullsLast().op("int8_ops")),
        idxBlockSportsSportId: index("idx_block_sports_sport_id").using("btree", table.sportId.asc().nullsLast().op("int8_ops")),
        blockSportsBlockIdFkey: foreignKey({
            columns: [table.blockId],
            foreignColumns: [blocks.id],
            name: "block_sports_block_id_fkey"
        }).onDelete("cascade"),
        blockSportsSportIdFkey: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "block_sports_sport_id_fkey"
        }).onDelete("cascade"),
        blockSportsBlockIdSportIdKey: unique("block_sports_block_id_sport_id_key").on(table.blockId, table.sportId),
    }
});

export const academics = pgTable("academics", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academics_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    slug: varchar({ length: 255 }).notNull(),
    entryFees: doublePrecision("entry_fees").default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint("user_id", { mode: "number" }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    image: varchar({ length: 255 }).default(sql`NULL`),
    policy: text(),
    extra: varchar({ length: 255 }).default(sql`NULL`),
    status: status().default('pending'),
    onboarded: boolean().default(false).notNull(),
}, (table) => {
    return {
        slugUnique: uniqueIndex("academics_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
        academicsUserIdForeign: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "academics_user_id_foreign"
        }),
    }
});

export const academicTranslations = pgTable("academic_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academic_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).default(sql`NULL`),
    description: text(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        academicIdLocaleUnique: uniqueIndex("academic_translations_academic_id_locale_unique").using("btree", table.academicId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        academicTranslationsAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "academic_translations_academic_id_foreign"
        }).onDelete("cascade"),
    }
});

export const branches = pgTable("branches", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branches_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    slug: varchar({ length: 255 }).notNull(),
    latitude: varchar({ length: 255 }).default(sql`NULL`),
    longitude: varchar({ length: 255 }).default(sql`NULL`),
    isDefault: boolean("is_default").default(false).notNull(),
    rate: doublePrecision(),
    reviews: integer(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    url: text().default(sql`NULL`),
    placeId: varchar("place_id", { length: 255 }).default(sql`NULL`),
    nameInGoogleMap: varchar("name_in_google_map", { length: 255 }).default(sql`NULL`),
    hidden: boolean("hidden").default(false).notNull(),
}, (table) => {
    return {
        // slugUnique: uniqueIndex("branches_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
        branchesAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "branches_academic_id_foreign"
        }),
    }
});

export const blockPackages = pgTable("block_packages", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "block_packages_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    blockId: bigint("block_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    packageId: bigint("package_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        idxBlockPackagesBlockId: index("idx_block_packages_block_id").using("btree", table.blockId.asc().nullsLast().op("int8_ops")),
        idxBlockPackagesPackageId: index("idx_block_packages_package_id").using("btree", table.packageId.asc().nullsLast().op("int8_ops")),
        blockPackagesBlockIdFkey: foreignKey({
            columns: [table.blockId],
            foreignColumns: [blocks.id],
            name: "block_packages_block_id_fkey"
        }).onDelete("cascade"),
        blockPackagesPackageIdFkey: foreignKey({
            columns: [table.packageId],
            foreignColumns: [packages.id],
            name: "block_packages_package_id_fkey"
        }).onDelete("cascade"),
        blockPackagesBlockIdPackageIdKey: unique("block_packages_block_id_package_id_key").on(table.blockId, table.packageId),
    }
});

export const branchTranslations = pgTable("branch_translations", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branch_translations_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    branchId: bigint("branch_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        branchIdLocaleUnique: uniqueIndex("branch_translations_branch_id_locale_unique").using("btree", table.branchId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        branchTranslationsBranchIdForeign: foreignKey({
            columns: [table.branchId],
            foreignColumns: [branches.id],
            name: "branch_translations_branch_id_foreign"
        }).onDelete("cascade"),
    }
});

export const branchFacility = pgTable("branch_facility", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branch_facility_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    branchId: bigint("branch_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    facilityId: bigint("facility_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        branchFacilityBranchIdForeign: foreignKey({
            columns: [table.branchId],
            foreignColumns: [branches.id],
            name: "branch_facility_branch_id_foreign"
        }).onDelete("cascade"),
        branchFacilityFacilityIdForeign: foreignKey({
            columns: [table.facilityId],
            foreignColumns: [facilities.id],
            name: "branch_facility_facility_id_foreign"
        }),
    }
});

export const promoCodes = pgTable("promo_codes", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "promo_codes_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    code: varchar({ length: 50 }).notNull(),
    discountType: discountType("discount_type").notNull(),
    discountValue: doublePrecision().notNull(),
    startDate: timestamp("start_date", { mode: 'string' }).notNull(),
    endDate: timestamp("end_date", { mode: 'string' }).notNull(),
    canBeUsed: integer("can_be_used").default(1).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        promoCodesAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "promo_codes_academic_id_foreign"
        }).onDelete("cascade"),
        promoCodesCodeAcademicUnique: unique("promo_codes_code_academic_unique").on(table.code, table.academicId),
    }
});

export const branchSport = pgTable("branch_sport", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branch_sport_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    branchId: bigint("branch_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    sportId: bigint("sport_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        branchSportBranchIdForeign: foreignKey({
            columns: [table.branchId],
            foreignColumns: [branches.id],
            name: "branch_sport_branch_id_foreign"
        }).onDelete("cascade"),
        branchSportSportIdForeign: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "branch_sport_sport_id_foreign"
        }).onDelete("cascade"),
    }
});

export const academicSport = pgTable("academic_sport", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academic_sport_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    sportId: bigint("sport_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        academicSportAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "academic_sport_academic_id_foreign"
        }),
        academicSportSportIdForeign: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "academic_sport_sport_id_foreign"
        }).onDelete('cascade'),
    }
});

export const media = pgTable("media", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "media_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    referableType: varchar("referable_type", { length: 255 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    referableId: bigint("referable_id", { mode: "number" }).notNull(),
    url: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).default('0').notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        referableTypeReferableIdIdx: index().using("btree", table.referableType.asc().nullsLast().op("int8_ops"), table.referableId.asc().nullsLast().op("int8_ops")),
    }
});

export const discounts = pgTable("discounts", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "discounts_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    type: discountType("type").notNull(),
    value: doublePrecision().notNull(),
    startDate: timestamp("start_date", { mode: 'string' }).notNull(),
    endDate: timestamp("end_date", { mode: 'string' }).notNull(),
    programId: bigint("program_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        discountsProgramIdForeign: foreignKey({
            columns: [table.programId],
            foreignColumns: [programs.id],
            name: "discounts_program_id_foreign"
        }).onDelete("cascade"),
    }
});

export const programs = pgTable("programs", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "programs_id_seq", startWith: 2000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }),
    type: varchar({ length: 255 }),
    numberOfSeats: integer("number_of_seats"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    branchId: bigint("branch_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    sportId: bigint("sport_id", { mode: "number" }),
    gender: varchar({ length: 255 }).default(sql`NULL`),
    name: varchar({ length: 255 }).default(sql`NULL`),
    description: text("description").default(sql`NULL`),
    startDateOfBirth: date("start_date_of_birth"),
    endDateOfBirth: date("end_date_of_birth"),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    color: varchar({ length: 255 }).default(sql`NULL`),
    assessmentDeductedFromProgram: boolean("assessment_deducted_from_program").default(false).notNull(),
    flexible: boolean("flexible").default(false).notNull(),
    hidden: boolean("hidden").default(false).notNull(),
    // New columns for absolute age storage
    startAgeMonths: integer("start_age_months"),
    endAgeMonths: integer("end_age_months"),
    isEndAgeUnlimited: boolean("is_end_age_unlimited").default(false).notNull(),
}, (table) => {
    return {
        programsAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "programs_academic_id_foreign"
        }).onDelete("cascade"),
        programsBranchIdForeign: foreignKey({
            columns: [table.branchId],
            foreignColumns: [branches.id],
            name: "programs_branch_id_foreign"
        }).onDelete("cascade"),
        programsSportIdForeign: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "programs_sport_id_foreign"
        }).onDelete('cascade'),
        programsTypeCheck: check("programs_type_check", sql`(type)::text = ANY ((ARRAY['TEAM'::character varying, 'PRIVATE'::character varying])::text[])`),
    }
});

export const coaches = pgTable("coaches", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coaches_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    name: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).default(sql`NULL`),
    image: varchar({ length: 255 }).default(sql`NULL`),
    bio: text(),
    gender: varchar({ length: 255 }).default(sql`NULL`),
    privateSessionPercentage: varchar("private_session_percentage", { length: 255 }).default(sql`NULL`),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    dateOfBirth: date("date_of_birth"),
}, (table) => {
    return {
        coachesAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "coaches_academic_id_foreign"
        }),
    }
});

export const blockPrograms = pgTable("block_programs", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "block_programs_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    blockId: bigint("block_id", { mode: "number" }).notNull(),
    programId: bigint("program_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        idxBlockProgramsBlockId: index("idx_block_programs_block_id").using("btree", table.blockId.asc().nullsLast().op("int8_ops")),
        idxBlockProgramsProgramId: index("idx_block_programs_program_id").using("btree", table.programId.asc().nullsLast().op("int8_ops")),
        blockProgramsBlockIdFkey: foreignKey({
            columns: [table.blockId],
            foreignColumns: [blocks.id],
            name: "block_programs_block_id_fkey"
        }).onDelete("cascade"),
        blockProgramsProgramIdFkey: foreignKey({
            columns: [table.programId],
            foreignColumns: [programs.id],
            name: "block_programs_program_id_fkey"
        }).onDelete("cascade"),
        blockProgramsBlockIdProgramIdKey: unique("block_programs_block_id_program_id_key").on(table.blockId, table.programId),
    }
});

export const academicAthletic = pgTable("academic_athletic", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academic_athletic_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint("user_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    profileId: bigint("profile_id", { mode: "number" }),
    sportId: bigint("sport_id", { mode: "number" }),
    certificate: varchar({ length: 255 }).default(sql`NULL`),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    type: athleticType().default('primary'),
    firstGuardianName: varchar("first_guardian_name", { length: 255 }).default(sql`NULL`),
    firstGuardianRelationship: varchar("first_guardian_relationship", { length: 255 }).default(sql`NULL`),
    firstGuardianEmail: varchar("first_guardian_email", { length: 255 }).default(sql`NULL`),
    firstGuardianPhone: varchar("first_guardian_phone", { length: 20 }).default(sql`NULL`),
    secondGuardianName: varchar("second_guardian_name", { length: 255 }).default(sql`NULL`),
    secondGuardianRelationship: varchar("second_guardian_relationship", { length: 255 }).default(sql`NULL`),
    secondGuardianEmail: varchar("second_guardian_email", { length: 255 }).default(sql`NULL`),
    secondGuardianPhone: varchar("second_guardian_phone", { length: 20 }).default(sql`NULL`),
}, (table) => {
    return {
        academicAthleticAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "academic_athletic_academic_id_foreign"
        }),
        academicAthleticUserIdForeign: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "academic_athletic_user_id_foreign"
        }),
        academicAthleticSportIdForeign: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "academic_athletic_sport_id_foreign"
        }).onDelete('cascade'),
    }
});

export const packages = pgTable("packages", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "packages_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    name: varchar({ length: 255 }).default('Assessment Package').notNull(),
    price: doublePrecision().notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    months: text("months").array(),
    sessionPerWeek: integer("session_per_week").default(0).notNull(),
    sessionDuration: integer("session_duration"),
    capacity: integer("capacity").default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    programId: bigint("program_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    memo: text(),
    entryFees: doublePrecision("entry_fees").default(0).notNull(),
    entryFeesExplanation: text("entry_fees_explanation"),
    entryFeesAppliedUntil: text("entry_fees_applied_until").array(),
    entryFeesStartDate: date("entry_fees_start_date"),
    entryFeesEndDate: date("entry_fees_end_date"),
    flexible: boolean("flexible"),
    hidden: boolean("hidden").default(false).notNull(),
    proRate: boolean("pro_rate").default(sql`NULL`), // Nullable boolean for Monthly pro rate
}, (table) => {
    return {
        packagesProgramIdForeign: foreignKey({
            columns: [table.programId],
            foreignColumns: [programs.id],
            name: "packages_program_id_foreign"
        }).onDelete("cascade"),
    }
});

export const packageDiscount = pgTable("package_discount", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "package_discount_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    packageId: bigint("package_id", { mode: "number" }).notNull(),
    discountId: bigint("discount_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        packageDiscountPackageIdForeign: foreignKey({
            columns: [table.packageId],
            foreignColumns: [packages.id],
            name: "package_discount_package_id_foreign"
        }).onDelete("cascade"),
        packageDiscountDiscountIdForeign: foreignKey({
            columns: [table.discountId],
            foreignColumns: [discounts.id],
            name: "package_discount_discount_id_foreign"
        }).onDelete("cascade"),
        packageDiscountUnique: unique("package_discount_unique").on(table.packageId, table.discountId),
    }
});

export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    userId: bigint("user_id", { mode: "number" }),
    profileId: bigint("profile_id", { mode: "number" }),
    academicId: bigint("academic_id", { mode: "number" }),
    readAt: timestamp("read_at", { mode: 'string' }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        userIdIdx: index("notifications_user_id_index").on(table.userId),
        profileIdIdx: index("notifications_profile_id_index").on(table.profileId),
        academicIdIdx: index("notifications_academic_id_index").on(table.academicId),
        userIdFk: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "notifications_user_id_foreign"
        }).onDelete("cascade"),
        profileIdFk: foreignKey({
            columns: [table.profileId],
            foreignColumns: [profiles.id],
            name: "notifications_profile_id_foreign"
        }).onDelete("cascade"),
        academicIdFk: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "notifications_academic_id_foreign"
        }).onDelete("cascade"),
    }
});

export const branchSportDeletionLog = pgTable("branch_sport_deletion_log", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "branch_sport_deletion_log_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    deleted_row_data: jsonb("deleted_row_data").notNull(),
    deleted_by_ip: inet("deleted_by_ip").notNull(),
    academy_id: bigint("academy_id", { mode: "number" })
        .references(() => academics.id, { onDelete: 'cascade' }),
    deleted_at: timestamp("deleted_at", { mode: 'string' })
        .defaultNow()
});

export const branchSportDeletionLogRelations = relations(branchSportDeletionLog, ({ one }) => ({
    academic: one(academics, {
        fields: [branchSportDeletionLog.academy_id],
        references: [academics.id]
    })
}));

export const branchSportViolations = pgTable("branch_sport_violations", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "branch_sport_violations_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    branchId: bigint("branch_id", { mode: "number" })
        .references(() => branches.id, { onDelete: 'cascade' })
        .notNull(),
    attemptedAt: timestamp("attempted_at", { mode: 'string' }).defaultNow().notNull(),
    violationType: varchar("violation_type", { length: 255 }).notNull(),
    details: jsonb("details").notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

// Table for tracking any deletions in the sports table
export const sportDeletionAudit = pgTable("sport_deletion_audit", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "sport_deletion_audit_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    tableName: varchar("table_name", { length: 255 }).notNull(),
    recordId: bigint("record_id", { mode: "number" }).notNull(),
    deletedAt: timestamp("deleted_at", { mode: 'string' }).defaultNow().notNull(),
    deletedBy: varchar("deleted_by", { length: 255 }),
    deletionContext: jsonb("deletion_context").notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const branchSportViolationsRelations = relations(branchSportViolations, ({ one }) => ({
    branch: one(branches, {
        fields: [branchSportViolations.branchId],
        references: [branches.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id]
    }),
    profile: one(profiles, {
        fields: [notifications.profileId],
        references: [profiles.id]
    }),
    academic: one(academics, {
        fields: [notifications.academicId],
        references: [academics.id]
    })
}));

export const entryFeesHistory = pgTable("entry_fees_history", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    profileId: bigint("profile_id", { mode: "number" }).notNull(),
    sportId: bigint("sport_id", { mode: "number" }).notNull(),
    programId: bigint("program_id", { mode: "number" }).notNull(), // To know which season
    paidAt: timestamp("paid_at", { mode: 'string' }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => ({
    entryFeesHistoryProfileIdForeign: foreignKey({
        columns: [table.profileId],
        foreignColumns: [profiles.id],
    }),
    entryFeesHistorySportIdForeign: foreignKey({
        columns: [table.sportId],
        foreignColumns: [sports.id],
    }).onDelete('cascade'),
    entryFeesHistoryProgramIdForeign: foreignKey({
        columns: [table.programId],
        foreignColumns: [programs.id],
    })
}));

export const schedules = pgTable("schedules", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "schedules_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    day: varchar({ length: 255 }).notNull(),
    from: time().notNull(),
    to: time().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    packageId: bigint("package_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    capacity: integer("capacity").notNull().default(0),
    memo: text(),
    startDateOfBirth: date("start_date_of_birth").default(sql`NULL`),
    endDateOfBirth: date("end_date_of_birth").default(sql`NULL`),
    gender: varchar({ length: 255 }).default(sql`NULL`),
    hidden: boolean("hidden").default(false).notNull(),
    // New fields for absolute age storage
    startAgeMonths: integer("start_age_months"),
    endAgeMonths: integer("end_age_months"),
    isEndAgeUnlimited: boolean("is_end_age_unlimited").default(false).notNull(),
}, (table) => {
    return {
        schedulesPackageIdForeign: foreignKey({
            columns: [table.packageId],
            foreignColumns: [packages.id],
            name: "schedules_package_id_foreign"
        }).onDelete("cascade"),
    }
});

export const bookings = pgTable("bookings", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "bookings_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    status: varchar({ length: 255 }).default('pending').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    coachId: bigint("coach_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    profileId: bigint("profile_id", { mode: "number" }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    packageId: bigint("package_id", { mode: "number" }).notNull(),
    price: doublePrecision().default(0).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    academyPolicy: boolean("academy_policy").default(false).notNull(),
    roapPolicy: boolean("roap_policy").default(false).notNull(),
    packagePrice: doublePrecision("package_price").default(0).notNull(),
    assessmentDeductionId: bigint("assessment_deduction_id", { mode: "number" }), // Optional, references assessment booking ID if this booking had an assessment fee deducted
    entryFeesPaid: boolean("entry_fees_paid").default(false).notNull(),
}, (table) => {
    return {
        bookingsCoachIdForeign: foreignKey({
            columns: [table.coachId],
            foreignColumns: [coaches.id],
            name: "bookings_coach_id_foreign"
        }).onDelete("cascade"),
        bookingsPackageIdForeign: foreignKey({
            columns: [table.packageId],
            foreignColumns: [packages.id],
            name: "bookings_package_id_foreign"
        }).onDelete("cascade"),
        bookingsProfileIdForeign: foreignKey({
            columns: [table.profileId],
            foreignColumns: [profiles.id],
            name: "bookings_profile_id_foreign"
        }).onDelete("cascade"),
        bookingsStatusCheck: check("bookings_status_check", sql`(status)::text = ANY ((ARRAY['success'::character varying, 'rejected'::character varying, 'pending'::character varying])::text[])`),
    }
});

export const bookingSessions = pgTable("booking_sessions", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "booking_sessions_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    date: date().notNull(),
    from: varchar({ length: 255 }).notNull(),
    to: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 255 }).default('pending').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    bookingId: bigint("booking_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        bookingSessionsBookingIdForeign: foreignKey({
            columns: [table.bookingId],
            foreignColumns: [bookings.id],
            name: "booking_sessions_booking_id_foreign"
        }).onDelete("cascade"),
        bookingSessionsStatusCheck: check("booking_sessions_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'upcoming'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])`),
    }
});

export const coachPackage = pgTable("coach_package", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_package_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    coachId: bigint("coach_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    packageId: bigint("package_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        coachPackageCoachIdForeign: foreignKey({
            columns: [table.coachId],
            foreignColumns: [coaches.id],
            name: "coach_package_coach_id_foreign"
        }).onDelete("cascade"),
        coachPackagePackageIdForeign: foreignKey({
            columns: [table.packageId],
            foreignColumns: [packages.id],
            name: "coach_package_package_id_foreign"
        }).onDelete("cascade"),
    }
});

export const coachProgram = pgTable("coach_program", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_program_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    coachId: bigint("coach_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    programId: bigint("program_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        coachProgramCoachIdForeign: foreignKey({
            columns: [table.coachId],
            foreignColumns: [coaches.id],
            name: "coach_program_coach_id_foreign"
        }),
        coachProgramProgramIdForeign: foreignKey({
            columns: [table.programId],
            foreignColumns: [programs.id],
            name: "coach_program_program_id_foreign"
        }).onDelete("cascade"),
    }
});

export const coachSpokenLanguage = pgTable("coach_spoken_language", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_spoken_language_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    coachId: bigint("coach_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        coachSpokenLanguageCoachIdForeign: foreignKey({
            columns: [table.coachId],
            foreignColumns: [coaches.id],
            name: "coach_spoken_language_coach_id_foreign"
        }).onDelete("cascade"),
        coachSpokenLanguageSpokenLanguageIdForeign: foreignKey({
            columns: [table.spokenLanguageId],
            foreignColumns: [spokenLanguages.id],
            name: "coach_spoken_language_spoken_language_id_foreign"
        }).onDelete("cascade"),
    }
});

export const coachSport = pgTable("coach_sport", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_sport_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    coachId: bigint("coach_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    sportId: bigint("sport_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        coachSportCoachIdForeign: foreignKey({
            columns: [table.coachId],
            foreignColumns: [coaches.id],
            name: "coach_sport_coach_id_foreign"
        }).onDelete("cascade"),
        coachSportSportIdForeign: foreignKey({
            columns: [table.sportId],
            foreignColumns: [sports.id],
            name: "coach_sport_sport_id_foreign"
        }).onDelete('cascade'),
    }
});

export const subscriptions = pgTable("subscriptions", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "subscriptions_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint("user_id", { mode: "number" }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    stripeId: varchar("stripe_id", { length: 255 }).notNull(),
    stripeStatus: varchar("stripe_status", { length: 255 }).notNull(),
    stripePrice: varchar("stripe_price", { length: 255 }).default(sql`NULL`),
    quantity: integer(),
    trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
    endsAt: timestamp("ends_at", { mode: 'string' }),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        stripeIdUnique: uniqueIndex("subscriptions_stripe_id_unique").using("btree", table.stripeId.asc().nullsLast().op("text_ops")),
        userIdStripeStatusIdx: index().using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.stripeStatus.asc().nullsLast().op("int8_ops")),
        subscriptionsUserIdForeign: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "subscriptions_user_id_foreign"
        }),
    }
});

export const subscriptionItems = pgTable("subscription_items", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "subscription_items_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    subscriptionId: bigint("subscription_id", { mode: "number" }).notNull(),
    stripeId: varchar("stripe_id", { length: 255 }).notNull(),
    stripeProduct: varchar("stripe_product", { length: 255 }).notNull(),
    stripePrice: varchar("stripe_price", { length: 255 }).notNull(),
    quantity: integer(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        stripeIdUnique: uniqueIndex("subscription_items_stripe_id_unique").using("btree", table.stripeId.asc().nullsLast().op("text_ops")),
        subscriptionIdStripePriceIdx: index().using("btree", table.subscriptionId.asc().nullsLast().op("int8_ops"), table.stripePrice.asc().nullsLast().op("int8_ops")),
        subscriptionItemsSubscriptionIdForeign: foreignKey({
            columns: [table.subscriptionId],
            foreignColumns: [subscriptions.id],
            name: "subscription_items_subscription_id_foreign"
        }),
    }
});

export const wishlist = pgTable("wishlist", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "wishlist_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    academicId: bigint("academic_id", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint("user_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        userIdAcademicIdUnique: uniqueIndex("wishlist_user_id_academic_id_unique").using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.academicId.asc().nullsLast().op("int8_ops")),
        wishlistAcademicIdForeign: foreignKey({
            columns: [table.academicId],
            foreignColumns: [academics.id],
            name: "wishlist_academic_id_foreign"
        }).onDelete("cascade"),
        wishlistUserIdForeign: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "wishlist_user_id_foreign"
        }).onDelete("cascade"),
    }
});

export const payments = pgTable("payments", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "payments_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
    resourceableType: varchar("resourceable_type", { length: 255 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    resourceableId: bigint("resourceable_id", { mode: "number" }).notNull(),
    price: doublePrecision().notNull(),
    paymentMethod: varchar("payment_method", { length: 255 }).default(sql`NULL`),
    merchantReferenceNumber: varchar("merchant_reference_number", { length: 255 }).default(sql`NULL`),
    status: varchar({ length: 255 }).default('pending').notNull(),
    referableType: varchar("referable_type", { length: 255 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    referableId: bigint("referable_id", { mode: "number" }).notNull(),
    referenceNumber: uuid("reference_number").notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        referableTypeReferableIdIdx: index().using("btree", table.referableType.asc().nullsLast().op("int8_ops"), table.referableId.asc().nullsLast().op("text_ops")),
        resourceableTypeResourceableIdIdx: index().using("btree", table.resourceableType.asc().nullsLast().op("text_ops"), table.resourceableId.asc().nullsLast().op("int8_ops")),
    }
});

export const pages = pgTable("pages", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "pages_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    orderBy: varchar("order_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
    image: varchar({ length: 255 }),
});

export const pageTranslations = pgTable("page_translations", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "page_translations_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    pageId: bigint("page_id", { mode: "number" }).notNull(),
    locale: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }),
    content: text("content"),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        pageIdLocaleUnique: uniqueIndex("page_translations_page_id_locale_unique")
            .using("btree", table.pageId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
        pageTranslationsPageIdForeign: foreignKey({
            columns: [table.pageId],
            foreignColumns: [pages.id],
            name: "page_translations_page_id_foreign"
        }).onDelete("cascade"),
    }
});

export const reviews = pgTable("reviews", {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
        name: "reviews_id_seq",
        startWith: 1000,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1
    }),
    branchId: bigint("branch_id", { mode: "number" }).notNull(),
    placeId: varchar("place_id", { length: 255 }).notNull(),
    authorName: varchar("author_name", { length: 255 }).notNull(),
    authorUrl: varchar("author_url", { length: 512 }).default(sql`NULL`),
    language: varchar({ length: 10 }).notNull(),
    originalLanguage: varchar("original_language", { length: 10 }).notNull(),
    profilePhotoUrl: varchar("profile_photo_url", { length: 512 }).default(sql`NULL`),
    rating: integer().notNull(),
    relativeTimeDescription: varchar("relative_time_description", { length: 100 }).notNull(),
    text: text().notNull(),
    time: bigint({ mode: "number" }).notNull(),
    translated: boolean().default(false).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }),
    updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => {
    return {
        reviewsBranchIdForeign: foreignKey({
            columns: [table.branchId],
            foreignColumns: [branches.id],
            name: "reviews_branch_id_foreign"
        }).onDelete("cascade"),
    }
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
    branch: one(branches, {
        fields: [reviews.branchId],
        references: [branches.id]
    }),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
    pageTranslations: many(pageTranslations),
}));

export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
    page: one(pages, {
        fields: [pageTranslations.pageId],
        references: [pages.id]
    }),
}));

export const discountsRelations = relations(discounts, ({ one, many }) => ({
    program: one(programs, {
        fields: [discounts.programId],
        references: [programs.id]
    }),
    packageDiscounts: many(packageDiscount)
}));

export const packageDiscountRelations = relations(packageDiscount, ({ one }) => ({
    package: one(packages, {
        fields: [packageDiscount.packageId],
        references: [packages.id]
    }),
    discount: one(discounts, {
        fields: [packageDiscount.discountId],
        references: [discounts.id]
    })
}));

export const entryFeesHistoryRelations = relations(entryFeesHistory, ({ one }) => ({
    profile: one(profiles, {
        fields: [entryFeesHistory.profileId],
        references: [profiles.id],
    }),
    sport: one(sports, {
        fields: [entryFeesHistory.sportId],
        references: [sports.id],
    }),
    program: one(programs, {
        fields: [entryFeesHistory.programId],
        references: [programs.id],
    })
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id]
    }),
    bookings: many(bookings),
}));

export const usersRelations = relations(users, ({ many }) => ({
    profiles: many(profiles),
    addresses: many(addresses),
    academics: many(academics),
    academicAthletics: many(academicAthletic),
    subscriptions: many(subscriptions),
    wishlists: many(wishlist),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
    academic: one(academics, {
        fields: [blocks.academicId],
        references: [academics.id]
    }),
    blockBranches: many(blockBranches),
    blockSports: many(blockSports),
    blockPackages: many(blockPackages),
    blockPrograms: many(blockPrograms),
}));

export const academicsRelations = relations(academics, ({ one, many }) => ({
    blocks: many(blocks),
    user: one(users, {
        fields: [academics.userId],
        references: [users.id]
    }),
    academicTranslations: many(academicTranslations),
    branches: many(branches),
    promoCodes: many(promoCodes),
    academicSports: many(academicSport),
    programs: many(programs),
    coaches: many(coaches),
    academicAthletics: many(academicAthletic),
    wishlists: many(wishlist),
}));

export const spokenLanguageTranslationsRelations = relations(spokenLanguageTranslations, ({ one }) => ({
    spokenLanguage: one(spokenLanguages, {
        fields: [spokenLanguageTranslations.spokenLanguageId],
        references: [spokenLanguages.id]
    }),
}));

export const spokenLanguagesRelations = relations(spokenLanguages, ({ many }) => ({
    spokenLanguageTranslations: many(spokenLanguageTranslations),
    coachSpokenLanguages: many(coachSpokenLanguage),
}));

export const blockBranchesRelations = relations(blockBranches, ({ one }) => ({
    block: one(blocks, {
        fields: [blockBranches.blockId],
        references: [blocks.id]
    }),
    branch: one(branches, {
        fields: [blockBranches.branchId],
        references: [branches.id]
    }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
    blockBranches: many(blockBranches),
    academic: one(academics, {
        fields: [branches.academicId],
        references: [academics.id]
    }),
    branchTranslations: many(branchTranslations),
    branchFacilities: many(branchFacility),
    branchSports: many(branchSport),
    programs: many(programs),
    reviews: many(reviews)
}));

export const countryTranslationsRelations = relations(countryTranslations, ({ one }) => ({
    country: one(countries, {
        fields: [countryTranslations.countryId],
        references: [countries.id]
    }),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
    countryTranslations: many(countryTranslations),
    states: many(states),
}));

export const statesRelations = relations(states, ({ one, many }) => ({
    country: one(countries, {
        fields: [states.countryId],
        references: [countries.id]
    }),
    stateTranslations: many(stateTranslations),
    cities: many(cities),
}));

export const stateTranslationsRelations = relations(stateTranslations, ({ one }) => ({
    state: one(states, {
        fields: [stateTranslations.stateId],
        references: [states.id]
    }),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
    state: one(states, {
        fields: [cities.stateId],
        references: [states.id]
    }),
    cityTranslations: many(cityTranslations),
    addresses: many(addresses),
}));

export const cityTranslationsRelations = relations(cityTranslations, ({ one }) => ({
    city: one(cities, {
        fields: [cityTranslations.cityId],
        references: [cities.id]
    }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
    city: one(cities, {
        fields: [addresses.cityId],
        references: [cities.id]
    }),
    user: one(users, {
        fields: [addresses.userId],
        references: [users.id]
    }),
}));

export const facilityTranslationsRelations = relations(facilityTranslations, ({ one }) => ({
    facility: one(facilities, {
        fields: [facilityTranslations.facilityId],
        references: [facilities.id]
    }),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
    facilityTranslations: many(facilityTranslations),
    branchFacilities: many(branchFacility),
}));

export const gendersRelations = relations(genders, ({ many }) => ({
    genderTranslations: many(genderTranslations),
}));

export const genderTranslationsRelations = relations(genderTranslations, ({ one }) => ({
    gender: one(genders, {
        fields: [genderTranslations.genderId],
        references: [genders.id]
    }),
}));

export const sportTranslationsRelations = relations(sportTranslations, ({ one }) => ({
    sport: one(sports, {
        fields: [sportTranslations.sportId],
        references: [sports.id]
    }),
}));

export const sportsRelations = relations(sports, ({ many }) => ({
    sportTranslations: many(sportTranslations),
    blockSports: many(blockSports),
    branchSports: many(branchSport),
    academicSports: many(academicSport),
    programs: many(programs),
    coachSports: many(coachSport),
    academicAthletics: many(academicAthletic),
}));

export const blockSportsRelations = relations(blockSports, ({ one }) => ({
    block: one(blocks, {
        fields: [blockSports.blockId],
        references: [blocks.id]
    }),
    sport: one(sports, {
        fields: [blockSports.sportId],
        references: [sports.id]
    }),
}));

export const academicTranslationsRelations = relations(academicTranslations, ({ one }) => ({
    academic: one(academics, {
        fields: [academicTranslations.academicId],
        references: [academics.id]
    }),
}));

export const blockPackagesRelations = relations(blockPackages, ({ one }) => ({
    block: one(blocks, {
        fields: [blockPackages.blockId],
        references: [blocks.id]
    }),
    package: one(packages, {
        fields: [blockPackages.packageId],
        references: [packages.id]
    }),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
    blockPackages: many(blockPackages),
    program: one(programs, {
        fields: [packages.programId],
        references: [programs.id]
    }),
    schedules: many(schedules),
    bookings: many(bookings),
    coachPackages: many(coachPackage),
    packageDiscounts: many(packageDiscount)
}));

export const branchTranslationsRelations = relations(branchTranslations, ({ one }) => ({
    branch: one(branches, {
        fields: [branchTranslations.branchId],
        references: [branches.id]
    }),
}));

export const branchFacilityRelations = relations(branchFacility, ({ one }) => ({
    branch: one(branches, {
        fields: [branchFacility.branchId],
        references: [branches.id]
    }),
    facility: one(facilities, {
        fields: [branchFacility.facilityId],
        references: [facilities.id]
    }),
}));

export const promoCodesRelations = relations(promoCodes, ({ one }) => ({
    academic: one(academics, {
        fields: [promoCodes.academicId],
        references: [academics.id]
    }),
}));

export const branchSportRelations = relations(branchSport, ({ one }) => ({
    branch: one(branches, {
        fields: [branchSport.branchId],
        references: [branches.id]
    }),
    sport: one(sports, {
        fields: [branchSport.sportId],
        references: [sports.id]
    }),
}));

export const academicSportRelations = relations(academicSport, ({ one }) => ({
    academic: one(academics, {
        fields: [academicSport.academicId],
        references: [academics.id]
    }),
    sport: one(sports, {
        fields: [academicSport.sportId],
        references: [sports.id]
    }),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
    academic: one(academics, {
        fields: [programs.academicId],
        references: [academics.id]
    }),
    branch: one(branches, {
        fields: [programs.branchId],
        references: [branches.id]
    }),
    sport: one(sports, {
        fields: [programs.sportId],
        references: [sports.id]
    }),
    packages: many(packages),
    coachPrograms: many(coachProgram),
    discounts: many(discounts),
    blockPrograms: many(blockPrograms),
}));

export const coachesRelations = relations(coaches, ({ one, many }) => ({
    academic: one(academics, {
        fields: [coaches.academicId],
        references: [academics.id]
    }),
    // blockCoaches: many(blockCoaches),
    bookings: many(bookings),
    coachPackages: many(coachPackage),
    coachPrograms: many(coachProgram),
    coachSpokenLanguages: many(coachSpokenLanguage),
    coachSports: many(coachSport),
}));

export const blockProgramsRelations = relations(blockPrograms, ({ one }) => ({
    block: one(blocks, {
        fields: [blockPrograms.blockId],
        references: [blocks.id]
    }),
    program: one(programs, {
        fields: [blockPrograms.programId],
        references: [programs.id]
    }),
}));

export const academicAthleticRelations = relations(academicAthletic, ({ one }) => ({
    academic: one(academics, {
        fields: [academicAthletic.academicId],
        references: [academics.id]
    }),
    user: one(users, {
        fields: [academicAthletic.userId],
        references: [users.id]
    }),
    sport: one(sports, {
        fields: [academicAthletic.sportId],
        references: [sports.id]
    }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
    package: one(packages, {
        fields: [schedules.packageId],
        references: [packages.id]
    }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
    coach: one(coaches, {
        fields: [bookings.coachId],
        references: [coaches.id]
    }),
    package: one(packages, {
        fields: [bookings.packageId],
        references: [packages.id]
    }),
    profile: one(profiles, {
        fields: [bookings.profileId],
        references: [profiles.id]
    }),
    bookingSessions: many(bookingSessions),
    assessmentBooking: one(bookings, {
        fields: [bookings.assessmentDeductionId],
        references: [bookings.id]
    })
}));

export const bookingSessionsRelations = relations(bookingSessions, ({ one }) => ({
    booking: one(bookings, {
        fields: [bookingSessions.bookingId],
        references: [bookings.id]
    }),
}));

export const coachPackageRelations = relations(coachPackage, ({ one }) => ({
    coach: one(coaches, {
        fields: [coachPackage.coachId],
        references: [coaches.id]
    }),
    package: one(packages, {
        fields: [coachPackage.packageId],
        references: [packages.id]
    }),
}));

export const coachProgramRelations = relations(coachProgram, ({ one }) => ({
    coach: one(coaches, {
        fields: [coachProgram.coachId],
        references: [coaches.id]
    }),
    program: one(programs, {
        fields: [coachProgram.programId],
        references: [programs.id]
    }),
}));

export const coachSpokenLanguageRelations = relations(coachSpokenLanguage, ({ one }) => ({
    coach: one(coaches, {
        fields: [coachSpokenLanguage.coachId],
        references: [coaches.id]
    }),
    spokenLanguage: one(spokenLanguages, {
        fields: [coachSpokenLanguage.spokenLanguageId],
        references: [spokenLanguages.id]
    }),
}));

export const coachSportRelations = relations(coachSport, ({ one }) => ({
    coach: one(coaches, {
        fields: [coachSport.coachId],
        references: [coaches.id]
    }),
    sport: one(sports, {
        fields: [coachSport.sportId],
        references: [sports.id]
    }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id]
    }),
    subscriptionItems: many(subscriptionItems),
}));

export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
    subscription: one(subscriptions, {
        fields: [subscriptionItems.subscriptionId],
        references: [subscriptions.id]
    }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
    academic: one(academics, {
        fields: [wishlist.academicId],
        references: [academics.id]
    }),
    user: one(users, {
        fields: [wishlist.userId],
        references: [users.id]
    }),
}));