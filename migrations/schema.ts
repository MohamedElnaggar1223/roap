import { pgTable, uniqueIndex, index, bigint, varchar, boolean, timestamp, unique, foreignKey, date, doublePrecision, text, integer, check, time, uuid, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const status = pgEnum("status", ['pending', 'accepted', 'rejected'])
export const userRoles = pgEnum("user_roles", ['admin', 'user', 'academic'])


export const users = pgTable("users", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "join_us_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "profiles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	gender: varchar({ length: 255 }).default(sql`NULL`),
	birthday: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	image: varchar({ length: 255 }).default(sql`NULL`),
	relationship: varchar({ length: 255 }).default('self').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
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

export const spokenLanguages = pgTable("spoken_languages", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "spoken_languages_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const spokenLanguageTranslations = pgTable("spoken_language_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "spoken_language_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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

export const countries = pgTable("countries", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "countries_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const countryTranslations = pgTable("country_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "country_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "states_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "state_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "cities_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "city_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "addresses_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "facilities_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const facilityTranslations = pgTable("facility_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "facility_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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

export const sports = pgTable("sports", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "sports_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "sport_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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

export const academics = pgTable("academics", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "academics_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "academic_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "branches_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	url: varchar({ length: 255 }).default(sql`NULL`),
	placeId: varchar("place_id", { length: 255 }).default(sql`NULL`),
	nameInGoogleMap: varchar("name_in_google_map", { length: 255 }).default(sql`NULL`),
}, (table) => {
	return {
		slugUnique: uniqueIndex("branches_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
		branchesAcademicIdForeign: foreignKey({
			columns: [table.academicId],
			foreignColumns: [academics.id],
			name: "branches_academic_id_foreign"
		}),
	}
});

export const branchTranslations = pgTable("branch_translations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "branch_translations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "branch_facility_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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

export const branchSport = pgTable("branch_sport", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "branch_sport_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
		}),
	}
});

export const programs = pgTable("programs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "programs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	description: varchar({ length: 255 }).default(sql`NULL`),
	startDateOfBirth: date("start_date_of_birth"),
	endDateOfBirth: date("end_date_of_birth"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
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
		}),
		programsTypeCheck: check("programs_type_check", sql`(type)::text = ANY ((ARRAY['TEAM'::character varying, 'PRIVATE'::character varying])::text[])`),
	}
});

export const academicSport = pgTable("academic_sport", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "academic_sport_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
		}),
	}
});

export const academicAthletic = pgTable("academic_athletic", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "academic_athletic_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	academicId: bigint("academic_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profileId: bigint("profile_id", { mode: "number" }),
	certificate: varchar({ length: 255 }).default(sql`NULL`),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
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
	}
});

export const coaches = pgTable("coaches", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "coaches_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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

export const packages = pgTable("packages", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "packages_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 255 }).default('Assessment Package').notNull(),
	price: doublePrecision().notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	sessionPerWeek: integer("session_per_week").default(0).notNull(),
	sessionDuration: integer("session_duration"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	programId: bigint("program_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	memo: text(),
}, (table) => {
	return {
		packagesProgramIdForeign: foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "packages_program_id_foreign"
		}).onDelete("cascade"),
	}
});

export const schedules = pgTable("schedules", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "schedules_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	day: varchar({ length: 255 }).notNull(),
	from: time().notNull(),
	to: time().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	packageId: bigint("package_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	memo: text(),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "bookings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "booking_sessions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "coach_package_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "coach_program_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "coach_spoken_language_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "coach_sport_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
		}),
	}
});

export const subscriptions = pgTable("subscriptions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "subscriptions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "subscription_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "wishlist_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "payments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
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
