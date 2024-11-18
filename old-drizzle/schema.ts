// import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, unique, varchar, double, timestamp, longtext, text, mysqlEnum, date, int, mediumtext, index, char, time } from "drizzle-orm/mysql-core"
// import { sql } from "drizzle-orm"

// export const academics = mysqlTable("academics", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	slug: varchar({ length: 255 }).notNull(),
// 	entryFees: double("entry_fees").notNull(),
// 	userId: bigint("user_id", { mode: "number" }).default('NULL').references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	image: varchar({ length: 255 }).default('NULL'),
// 	policy: longtext().default('NULL'),
// 	extra: varchar({ length: 255 }).default('NULL'),
// },
// (table) => {
// 	return {
// 		academicsSlugUnique: unique("academics_slug_unique").on(table.slug),
// 	}
// });

// export const academicAthletic = mysqlTable("academic_athletic", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	profileId: bigint("profile_id", { mode: "number" }).default('NULL').references(() => profiles.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	sportId: bigint("sport_id", { mode: "number" }).default('NULL').references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const academicSport = mysqlTable("academic_sport", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const academicTranslations = mysqlTable("academic_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).default('NULL'),
// 	description: text().default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		academicTranslationsAcademicIdLocaleUnique: unique("academic_translations_academic_id_locale_unique").on(table.academicId, table.locale),
// 	}
// });

// export const addresses = mysqlTable("addresses", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	streetAddress: varchar("street_address", { length: 255 }).notNull(),
// 	postalCode: varchar("postal_code", { length: 255 }).default('NULL'),
// 	cityId: bigint("city_id", { mode: "number" }).notNull().references(() => cities.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		addressesUserIdUnique: unique("addresses_user_id_unique").on(table.userId),
// 	}
// });

// export const bookings = mysqlTable("bookings", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	status: mysqlEnum(['success','rejected','pending']).default('\'pending\'').notNull(),
// 	coachId: bigint("coach_id", { mode: "number" }).default('NULL').references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	profileId: bigint("profile_id", { mode: "number" }).default('NULL').references(() => profiles.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	price: double().notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	academyPolicy: tinyint("academy_policy").default(0).notNull(),
// 	roapPolicy: tinyint("roap_policy").default(0).notNull(),
// 	packagePrice: double("package_price").notNull(),
// });

// export const bookingSessions = mysqlTable("booking_sessions", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	date: date({ mode: 'string' }).notNull(),
// 	from: varchar({ length: 255 }).notNull(),
// 	to: varchar({ length: 255 }).notNull(),
// 	status: mysqlEnum(['pending','accepted','upcoming','rejected','cancelled']).default('\'pending\'').notNull(),
// 	bookingId: bigint("booking_id", { mode: "number" }).notNull().references(() => bookings.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const branches = mysqlTable("branches", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	slug: varchar({ length: 255 }).notNull(),
// 	latitude: varchar({ length: 255 }).default('NULL'),
// 	longitude: varchar({ length: 255 }).default('NULL'),
// 	isDefault: tinyint("is_default").default(0).notNull(),
// 	rate: double().default('NULL'),
// 	reviews: int().default('NULL'),
// 	academicId: bigint("academic_id", { mode: "number" }).default('NULL').references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	url: varchar({ length: 255 }).default('NULL'),
// 	placeId: varchar("place_id", { length: 255 }).default('NULL'),
// 	nameInGoogleMap: varchar("name_in_google_map", { length: 255 }).default('NULL'),
// },
// (table) => {
// 	return {
// 		branchesSlugUnique: unique("branches_slug_unique").on(table.slug),
// 	}
// });

// export const branchFacility = mysqlTable("branch_facility", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	facilityId: bigint("facility_id", { mode: "number" }).notNull().references(() => facilities.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const branchSport = mysqlTable("branch_sport", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const branchTranslations = mysqlTable("branch_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		branchTranslationsBranchIdLocaleUnique: unique("branch_translations_branch_id_locale_unique").on(table.branchId, table.locale),
// 	}
// });

// export const cache = mysqlTable("cache", {
// 	key: varchar({ length: 255 }).notNull(),
// 	value: mediumtext().notNull(),
// 	expiration: int().notNull(),
// });

// export const cacheLocks = mysqlTable("cache_locks", {
// 	key: varchar({ length: 255 }).notNull(),
// 	owner: varchar({ length: 255 }).notNull(),
// 	expiration: int().notNull(),
// });

// export const cities = mysqlTable("cities", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	stateId: bigint("state_id", { mode: "number" }).notNull().references(() => states.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const cityTranslations = mysqlTable("city_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	cityId: bigint("city_id", { mode: "number" }).notNull().references(() => cities.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		cityTranslationsCityIdLocaleUnique: unique("city_translations_city_id_locale_unique").on(table.cityId, table.locale),
// 	}
// });

// export const coaches = mysqlTable("coaches", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	title: varchar({ length: 255 }).default('NULL'),
// 	image: varchar({ length: 255 }).default('NULL'),
// 	bio: text().default('NULL'),
// 	gender: varchar({ length: 255 }).default('NULL'),
// 	privateSessionPercentage: varchar("private_session_percentage", { length: 255 }).default('NULL'),
// 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	dateOfBirth: date("date_of_birth", { mode: 'string' }).default('NULL'),
// });

// export const coachPackage = mysqlTable("coach_package", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const coachProgram = mysqlTable("coach_program", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	programId: bigint("program_id", { mode: "number" }).notNull().references(() => programs.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const coachSpokenLanguage = mysqlTable("coach_spoken_language", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull().references(() => spokenLanguages.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const coachSport = mysqlTable("coach_sport", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const countries = mysqlTable("countries", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const countryTranslations = mysqlTable("country_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	countryId: bigint("country_id", { mode: "number" }).notNull().references(() => countries.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		countryTranslationsCountryIdLocaleUnique: unique("country_translations_country_id_locale_unique").on(table.countryId, table.locale),
// 	}
// });

// export const facilities = mysqlTable("facilities", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const facilityTranslations = mysqlTable("facility_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	facilityId: bigint("facility_id", { mode: "number" }).notNull().references(() => facilities.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		facilityTranslationsFacilityIdLocaleUnique: unique("facility_translations_facility_id_locale_unique").on(table.facilityId, table.locale),
// 	}
// });

// export const failedJobs = mysqlTable("failed_jobs", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	uuid: varchar({ length: 255 }).notNull(),
// 	connection: text().notNull(),
// 	queue: text().notNull(),
// 	payload: longtext().notNull(),
// 	exception: longtext().notNull(),
// 	failedAt: timestamp("failed_at", { mode: 'string' }).default('current_timestamp()').notNull(),
// },
// (table) => {
// 	return {
// 		failedJobsUuidUnique: unique("failed_jobs_uuid_unique").on(table.uuid),
// 	}
// });

// export const jobs = mysqlTable("jobs", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	queue: varchar({ length: 255 }).notNull(),
// 	payload: longtext().notNull(),
// 	attempts: tinyint().notNull(),
// 	reservedAt: int("reserved_at").default('NULL'),
// 	availableAt: int("available_at").notNull(),
// 	createdAt: int("created_at").notNull(),
// },
// (table) => {
// 	return {
// 		queueIdx: index().on(table.queue),
// 	}
// });

// export const jobBatches = mysqlTable("job_batches", {
// 	id: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	totalJobs: int("total_jobs").notNull(),
// 	pendingJobs: int("pending_jobs").notNull(),
// 	failedJobs: int("failed_jobs").notNull(),
// 	failedJobIds: longtext("failed_job_ids").notNull(),
// 	options: mediumtext().default('NULL'),
// 	cancelledAt: int("cancelled_at").default('NULL'),
// 	createdAt: int("created_at").notNull(),
// 	finishedAt: int("finished_at").default('NULL'),
// });

// export const joinUs = mysqlTable("join_us", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	email: varchar({ length: 255 }).notNull(),
// 	phone: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		joinUsPhoneEmailUnique: unique("join_us_phone_email_unique").on(table.phone, table.email),
// 	}
// });

// export const media = mysqlTable("media", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	referableType: varchar("referable_type", { length: 255 }).notNull(),
// 	referableId: bigint("referable_id", { mode: "number" }).notNull(),
// 	url: varchar({ length: 255 }).notNull(),
// 	type: varchar({ length: 255 }).default('\'0\'').notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		referableTypeReferableIdIdx: index().on(table.referableType, table.referableId),
// 	}
// });

// export const migrations = mysqlTable("migrations", {
// 	id: int().autoincrement().notNull(),
// 	migration: varchar({ length: 255 }).notNull(),
// 	batch: int().notNull(),
// });

// export const modelHasPermissions = mysqlTable("model_has_permissions", {
// 	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	modelType: varchar("model_type", { length: 255 }).notNull(),
// 	modelId: bigint("model_id", { mode: "number" }).notNull(),
// },
// (table) => {
// 	return {
// 		modelIdModelTypeIdx: index().on(table.modelId, table.modelType),
// 	}
// });

// export const modelHasRoles = mysqlTable("model_has_roles", {
// 	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	modelType: varchar("model_type", { length: 255 }).notNull(),
// 	modelId: bigint("model_id", { mode: "number" }).notNull(),
// },
// (table) => {
// 	return {
// 		modelIdModelTypeIdx: index().on(table.modelId, table.modelType),
// 	}
// });

// export const notifications = mysqlTable("notifications", {
// 	id: char({ length: 36 }).notNull(),
// 	type: varchar({ length: 255 }).notNull(),
// 	notifiableType: varchar("notifiable_type", { length: 255 }).notNull(),
// 	notifiableId: bigint("notifiable_id", { mode: "number" }).notNull(),
// 	data: text().notNull(),
// 	readAt: timestamp("read_at", { mode: 'string' }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		notifiableTypeNotifiableIdIdx: index().on(table.notifiableType, table.notifiableId),
// 	}
// });

// export const otpVerifications = mysqlTable("otp_verifications", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	otp: varchar({ length: 255 }).notNull(),
// 	phoneNumber: varchar("phone_number", { length: 255 }).notNull(),
// 	userId: bigint("user_id", { mode: "number" }).default('NULL').references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	expiredAt: timestamp("expired_at", { mode: 'string' }).default('NULL'),
// 	verifiedAt: timestamp("verified_at", { mode: 'string' }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		otpVerificationsPhoneNumberUnique: unique("otp_verifications_phone_number_unique").on(table.phoneNumber),
// 	}
// });

// export const packages = mysqlTable("packages", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).default('\'Assessment Package\'').notNull(),
// 	price: double().notNull(),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	startDate: date("start_date", { mode: 'string' }).notNull(),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	endDate: date("end_date", { mode: 'string' }).notNull(),
// 	sessionPerWeek: int("session_per_week").default(0).notNull(),
// 	sessionDuration: int("session_duration").default('NULL'),
// 	programId: bigint("program_id", { mode: "number" }).notNull().references(() => programs.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	memo: text().default('NULL'),
// });

// export const pages = mysqlTable("pages", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	orderBy: varchar("order_by", { length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	image: varchar({ length: 255 }).default('NULL'),
// });

// export const pageTranslations = mysqlTable("page_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	pageId: bigint("page_id", { mode: "number" }).notNull().references(() => pages.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	title: varchar({ length: 255 }).default('NULL'),
// 	content: text().default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		pageTranslationsPageIdLocaleUnique: unique("page_translations_page_id_locale_unique").on(table.pageId, table.locale),
// 	}
// });

// export const passwordResetTokens = mysqlTable("password_reset_tokens", {
// 	email: varchar({ length: 255 }).notNull(),
// 	token: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// });

// export const payments = mysqlTable("payments", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	resourceableType: varchar("resourceable_type", { length: 255 }).notNull(),
// 	resourceableId: bigint("resourceable_id", { mode: "number" }).notNull(),
// 	price: double().notNull(),
// 	paymentMethod: varchar("payment_method", { length: 255 }).default('NULL'),
// 	merchantReferenceNumber: varchar("merchant_reference_number", { length: 255 }).default('NULL'),
// 	status: varchar({ length: 255 }).default('\'pending\'').notNull(),
// 	referableType: varchar("referable_type", { length: 255 }).notNull(),
// 	referableId: bigint("referable_id", { mode: "number" }).notNull(),
// 	referenceNumber: char("reference_number", { length: 36 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		resourceableTypeResourceableIdIdx: index().on(table.resourceableType, table.resourceableId),
// 		referableTypeReferableIdIdx: index().on(table.referableType, table.referableId),
// 	}
// });

// export const permissions = mysqlTable("permissions", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	guardName: varchar("guard_name", { length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	label: varchar({ length: 255 }).default('NULL'),
// },
// (table) => {
// 	return {
// 		permissionsNameGuardNameUnique: unique("permissions_name_guard_name_unique").on(table.name, table.guardName),
// 	}
// });

// export const personalAccessTokens = mysqlTable("personal_access_tokens", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
// 	tokenableId: bigint("tokenable_id", { mode: "number" }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	token: varchar({ length: 64 }).notNull(),
// 	abilities: text().default('NULL'),
// 	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).default('NULL'),
// 	expiresAt: timestamp("expires_at", { mode: 'string' }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		tokenableTypeTokenableIdIdx: index().on(table.tokenableType, table.tokenableId),
// 		personalAccessTokensTokenUnique: unique("personal_access_tokens_token_unique").on(table.token),
// 	}
// });

// export const profiles = mysqlTable("profiles", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	gender: varchar({ length: 255 }).default('NULL'),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	birthday: date({ mode: 'string' }).default('NULL'),
// 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	image: varchar({ length: 255 }).default('NULL'),
// 	relationship: varchar({ length: 255 }).default('\'self\'').notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		profilesRelationshipBirthdayNameUserIdUnique: unique("profiles_relationship_birthday_name_user_id_unique").on(table.relationship, table.birthday, table.name, table.userId),
// 	}
// });

// export const programs = mysqlTable("programs", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	academicId: bigint("academic_id", { mode: "number" }).default('NULL').references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	type: mysqlEnum(['TEAM','PRIVATE']).default('NULL'),
// 	numberOfSeats: int("number_of_seats").default('NULL'),
// 	branchId: bigint("branch_id", { mode: "number" }).default('NULL').references(() => branches.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	sportId: bigint("sport_id", { mode: "number" }).default('NULL').references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" } ),
// 	gender: varchar({ length: 255 }).default('NULL'),
// 	name: varchar({ length: 255 }).default('NULL'),
// 	description: varchar({ length: 255 }).default('NULL'),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	startDateOfBirth: date("start_date_of_birth", { mode: 'string' }).default('NULL'),
// 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// 	endDateOfBirth: date("end_date_of_birth", { mode: 'string' }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const roles = mysqlTable("roles", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	guardName: varchar("guard_name", { length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		rolesNameGuardNameUnique: unique("roles_name_guard_name_unique").on(table.name, table.guardName),
// 	}
// });

// export const roleHasPermissions = mysqlTable("role_has_permissions", {
// 	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// });

// export const schedules = mysqlTable("schedules", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	day: varchar({ length: 255 }).notNull(),
// 	from: time().notNull(),
// 	to: time().notNull(),
// 	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	memo: text().default('NULL'),
// });

// export const sessions = mysqlTable("sessions", {
// 	id: varchar({ length: 255 }).notNull(),
// 	userId: bigint("user_id", { mode: "number" }).default('NULL'),
// 	ipAddress: varchar("ip_address", { length: 45 }).default('NULL'),
// 	userAgent: text("user_agent").default('NULL'),
// 	payload: longtext().notNull(),
// 	lastActivity: int("last_activity").notNull(),
// },
// (table) => {
// 	return {
// 		userIdIdx: index().on(table.userId),
// 		lastActivityIdx: index().on(table.lastActivity),
// 	}
// });

// export const settings = mysqlTable("settings", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	key: varchar({ length: 255 }).notNull(),
// 	value: longtext().notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const spokenLanguages = mysqlTable("spoken_languages", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const spokenLanguageTranslations = mysqlTable("spoken_language_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull().references(() => spokenLanguages.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		spokenLanguageTranslationsSpokenLanguageIdLocaleUnique: unique("spoken_language_translations_spoken_language_id_locale_unique").on(table.spokenLanguageId, table.locale),
// 	}
// });

// export const sports = mysqlTable("sports", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	slug: varchar({ length: 255 }).default('NULL'),
// 	image: varchar({ length: 255 }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		sportsSlugUnique: unique("sports_slug_unique").on(table.slug),
// 	}
// });

// export const sportTranslations = mysqlTable("sport_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		sportTranslationsSportIdLocaleUnique: unique("sport_translations_sport_id_locale_unique").on(table.sportId, table.locale),
// 	}
// });

// export const states = mysqlTable("states", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	countryId: bigint("country_id", { mode: "number" }).notNull().references(() => countries.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// });

// export const stateTranslations = mysqlTable("state_translations", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	stateId: bigint("state_id", { mode: "number" }).notNull().references(() => states.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	locale: varchar({ length: 255 }).notNull(),
// 	name: varchar({ length: 255 }).notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		stateTranslationsStateIdLocaleUnique: unique("state_translations_state_id_locale_unique").on(table.stateId, table.locale),
// 	}
// });

// export const subscriptions = mysqlTable("subscriptions", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	userId: bigint("user_id", { mode: "number" }).notNull(),
// 	type: varchar({ length: 255 }).notNull(),
// 	stripeId: varchar("stripe_id", { length: 255 }).notNull(),
// 	stripeStatus: varchar("stripe_status", { length: 255 }).notNull(),
// 	stripePrice: varchar("stripe_price", { length: 255 }).default('NULL'),
// 	quantity: int().default('NULL'),
// 	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }).default('NULL'),
// 	endsAt: timestamp("ends_at", { mode: 'string' }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		userIdStripeStatusIdx: index().on(table.userId, table.stripeStatus),
// 		subscriptionsStripeIdUnique: unique("subscriptions_stripe_id_unique").on(table.stripeId),
// 	}
// });

// export const subscriptionItems = mysqlTable("subscription_items", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	subscriptionId: bigint("subscription_id", { mode: "number" }).notNull(),
// 	stripeId: varchar("stripe_id", { length: 255 }).notNull(),
// 	stripeProduct: varchar("stripe_product", { length: 255 }).notNull(),
// 	stripePrice: varchar("stripe_price", { length: 255 }).notNull(),
// 	quantity: int().default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		subscriptionIdStripePriceIdx: index().on(table.subscriptionId, table.stripePrice),
// 		subscriptionItemsStripeIdUnique: unique("subscription_items_stripe_id_unique").on(table.stripeId),
// 	}
// });

// export const users = mysqlTable("users", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	name: varchar({ length: 255 }).default('NULL'),
// 	email: varchar({ length: 255 }).default('NULL'),
// 	phoneNumber: varchar("phone_number", { length: 255 }).default('NULL'),
// 	googleId: varchar("google_id", { length: 255 }).default('NULL'),
// 	appleId: varchar("apple_id", { length: 255 }).default('NULL'),
// 	isAthletic: tinyint("is_athletic").default(0).notNull(),
// 	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }).default('NULL'),
// 	password: varchar({ length: 255 }).default('NULL'),
// 	rememberToken: varchar("remember_token", { length: 100 }).default('NULL'),
// 	deviceToken: varchar("device_token", { length: 400 }).default('NULL'),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// 	stripeId: varchar("stripe_id", { length: 255 }).default('NULL'),
// 	pmType: varchar("pm_type", { length: 255 }).default('NULL'),
// 	pmLastFour: varchar("pm_last_four", { length: 4 }).default('NULL'),
// 	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }).default('NULL'),
// 	deletedAt: timestamp("deleted_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		stripeIdIdx: index().on(table.stripeId),
// 		usersEmailUnique: unique("users_email_unique").on(table.email),
// 		usersPhoneNumberUnique: unique("users_phone_number_unique").on(table.phoneNumber),
// 	}
// });

// export const wishlist = mysqlTable("wishlist", {
// 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).default('NULL'),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).default('NULL'),
// },
// (table) => {
// 	return {
// 		wishlistUserIdAcademicIdUnique: unique("wishlist_user_id_academic_id_unique").on(table.userId, table.academicId),
// 	}
// });
