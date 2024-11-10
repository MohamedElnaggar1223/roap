import { sql } from "drizzle-orm";
import { mysqlTable, unique, varchar, double, timestamp, longtext, text, mysqlEnum, date, int, mediumtext, index, time, bigint, tinyint } from "drizzle-orm/mysql-core"
import { relations } from "drizzle-orm/relations";

export const academics = mysqlTable("academics", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	entryFees: double("entry_fees").notNull(),
	userId: bigint("user_id", { mode: "number" }).default(sql`null`).references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	image: varchar({ length: 255 }).default(sql`null`),
	policy: longtext().default(sql`null`),
	status: mysqlEnum(['pending', 'accepted', 'rejected']).default('pending').notNull(),
},
	(table) => {
		return {
			academicsSlugUnique: unique("academics_slug_unique").on(table.slug),
		}
	});

export const academicAthletic = mysqlTable("academic_athletic", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
	profileId: bigint("profile_id", { mode: "number" }).default(sql`null`).references(() => profiles.id, { onDelete: "restrict", onUpdate: "restrict" }),
	sportId: bigint("sport_id", { mode: "number" }).default(sql`null`).references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const academicSport = mysqlTable("academic_sport", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const academicTranslations = mysqlTable("academic_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).default(sql`null`),
	description: text().default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			academicTranslationsAcademicIdLocaleUnique: unique("academic_translations_academic_id_locale_unique").on(table.academicId, table.locale),
		}
	});

export const addresses = mysqlTable("addresses", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	streetAddress: varchar("street_address", { length: 255 }).notNull(),
	postalCode: varchar("postal_code", { length: 255 }).default(sql`null`),
	cityId: bigint("city_id", { mode: "number" }).notNull().references(() => cities.id, { onDelete: "restrict", onUpdate: "restrict" }),
	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			addressesUserIdUnique: unique("addresses_user_id_unique").on(table.userId),
		}
	});

export const bookings = mysqlTable("bookings", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	status: mysqlEnum(['success', 'rejected', 'pending']).default('pending').notNull(),
	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" }),
	profileId: bigint("profile_id", { mode: "number" }).default(sql`null`).references(() => profiles.id, { onDelete: "cascade", onUpdate: "restrict" }),
	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "cascade", onUpdate: "restrict" }),
	price: double().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	academyPolicy: tinyint("academy_policy").default(0).notNull(),
	roapPolicy: tinyint("roap_policy").default(0).notNull(),
	packagePrice: double("package_price").notNull(),
});

export const bookingSessions = mysqlTable("booking_sessions", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	from: varchar({ length: 255 }).notNull(),
	to: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['pending', 'accepted', 'upcoming', 'rejected', 'cancelled']).default('pending').notNull(),
	bookingId: bigint("booking_id", { mode: "number" }).notNull().references(() => bookings.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const branches = mysqlTable("branches", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	latitude: varchar({ length: 255 }).default(sql`null`),
	longitude: varchar({ length: 255 }).default(sql`null`),
	isDefault: tinyint("is_default").default(0).notNull(),
	rate: double().default(sql`null`),
	reviews: int().default(sql`null`),
	academicId: bigint("academic_id", { mode: "number" }).default(sql`null`).references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	url: varchar({ length: 255 }).default(sql`null`),
	placeId: varchar("place_id", { length: 255 }).default(sql`null`),
	nameInGoogleMap: varchar("name_in_google_map", { length: 255 }).default(sql`null`),
},
	(table) => {
		return {
			branchesSlugUnique: unique("branches_slug_unique").on(table.slug),
		}
	});

export const branchFacility = mysqlTable("branch_facility", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "restrict", onUpdate: "restrict" }),
	facilityId: bigint("facility_id", { mode: "number" }).notNull().references(() => facilities.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const branchSport = mysqlTable("branch_sport", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "restrict", onUpdate: "restrict" }),
	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const branchTranslations = mysqlTable("branch_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			branchTranslationsBranchIdLocaleUnique: unique("branch_translations_branch_id_locale_unique").on(table.branchId, table.locale),
		}
	});

export const cache = mysqlTable("cache", {
	key: varchar({ length: 255 }).notNull(),
	value: mediumtext().notNull(),
	expiration: int().notNull(),
});

export const cacheLocks = mysqlTable("cache_locks", {
	key: varchar({ length: 255 }).notNull(),
	owner: varchar({ length: 255 }).notNull(),
	expiration: int().notNull(),
});

export const cities = mysqlTable("cities", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	stateId: bigint("state_id", { mode: "number" }).notNull().references(() => states.id, { onDelete: "cascade", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const cityTranslations = mysqlTable("city_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	cityId: bigint("city_id", { mode: "number" }).notNull().references(() => cities.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			cityTranslationsCityIdLocaleUnique: unique("city_translations_city_id_locale_unique").on(table.cityId, table.locale),
		}
	});

export const coaches = mysqlTable("coaches", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	image: varchar({ length: 255 }).default(sql`null`),
	bio: text().default(sql`null`),
	gender: varchar({ length: 255 }).default(sql`null`),
	privateSessionPercentage: varchar("private_session_percentage", { length: 255 }).default(sql`null`),
	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfBirth: date("date_of_birth", { mode: 'string' }).default(sql`null`),
});

export const coachPackage = mysqlTable("coach_package", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" }),
	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const coachProgram = mysqlTable("coach_program", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" }),
	programId: bigint("program_id", { mode: "number" }).notNull().references(() => programs.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const coachSpokenLanguage = mysqlTable("coach_spoken_language", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull().references(() => spokenLanguages.id, { onDelete: "cascade", onUpdate: "restrict" }),
	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const coachSport = mysqlTable("coach_sport", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" }),
	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const countries = mysqlTable("countries", {
	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const countryTranslations = mysqlTable("country_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
	countryId: bigint("country_id", { mode: "number" }).notNull().references(() => countries.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			countryTranslationsCountryIdLocaleUnique: unique("country_translations_country_id_locale_unique").on(table.countryId, table.locale),
		}
	});

export const facilities = mysqlTable("facilities", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const facilityTranslations = mysqlTable("facility_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	facilityId: bigint("facility_id", { mode: "number" }).notNull().references(() => facilities.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			facilityTranslationsFacilityIdLocaleUnique: unique("facility_translations_facility_id_locale_unique").on(table.facilityId, table.locale),
		}
	});

export const failedJobs = mysqlTable("failed_jobs", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	uuid: varchar({ length: 255 }).notNull(),
	connection: text().notNull(),
	queue: text().notNull(),
	payload: longtext().notNull(),
	exception: longtext().notNull(),
	failedAt: timestamp("failed_at", { mode: 'string' }).default('current_timestamp()').notNull(),
},
	(table) => {
		return {
			failedJobsUuidUnique: unique("failed_jobs_uuid_unique").on(table.uuid),
		}
	});

export const jobs = mysqlTable("jobs", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	queue: varchar({ length: 255 }).notNull(),
	payload: longtext().notNull(),
	attempts: tinyint().notNull(),
	reservedAt: int("reserved_at").default(sql`null`),
	availableAt: int("available_at").notNull(),
	createdAt: int("created_at").notNull(),
},
	(table) => {
		return {
			queueIdx: index('jobs_queue_index').on(table.queue),
		}
	});

export const jobBatches = mysqlTable("job_batches", {
	id: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	totalJobs: int("total_jobs").notNull(),
	pendingJobs: int("pending_jobs").notNull(),
	failedJobs: int("failed_jobs").notNull(),
	failedJobIds: longtext("failed_job_ids").notNull(),
	options: mediumtext().default(sql`null`),
	cancelledAt: int("cancelled_at").default(sql`null`),
	createdAt: int("created_at").notNull(),
	finishedAt: int("finished_at").default(sql`null`),
});

export const joinUs = mysqlTable("join_us", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			joinUsPhoneEmailUnique: unique("join_us_phone_email_unique").on(table.phone, table.email),
		}
	});

export const media = mysqlTable("media", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	referableType: varchar("referable_type", { length: 255 }).notNull(),
	referableId: bigint("referable_id", { mode: "number" }).notNull(),
	url: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).default('\'0\'').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			referableTypeReferableIdIdx: index('media_referable_type_referable_id_index').on(table.referableType, table.referableId),
		}
	});

export const migrations = mysqlTable("migrations", {
	id: int().autoincrement().notNull(),
	migration: varchar({ length: 255 }).notNull(),
	batch: int().notNull(),
});

export const modelHasPermissions = mysqlTable("model_has_permissions", {
	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "restrict" }),
	modelType: varchar("model_type", { length: 255 }).notNull(),
	modelId: bigint("model_id", { mode: "number" }).notNull(),
},
	(table) => {
		return {
			modelIdModelTypeIdx: index('model_has_permissions_model_id_model_type_index').on(table.modelId, table.modelType),
		}
	});

export const modelHasRoles = mysqlTable("model_has_roles", {
	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "restrict" }),
	modelType: varchar("model_type", { length: 255 }).notNull(),
	modelId: bigint("model_id", { mode: "number" }).notNull(),
},
	(table) => {
		return {
			modelIdModelTypeIdx: index('model_has_roles_model_id_model_type_index').on(table.modelId, table.modelType),
		}
	});

export const notifications = mysqlTable("notifications", {
	// Warning: Can't parse uuid from database
	// uuidType: uuid("id").notNull(),
	type: varchar({ length: 255 }).notNull(),
	notifiableType: varchar("notifiable_type", { length: 255 }).notNull(),
	notifiableId: bigint("notifiable_id", { mode: "number" }).notNull(),
	data: text().notNull(),
	readAt: timestamp("read_at", { mode: 'string' }).default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			notifiableTypeNotifiableIdIdx: index('notifications_notifiable_type_notifiable_id_index').on(table.notifiableType, table.notifiableId),
		}
	});

export const otpVerifications = mysqlTable("otp_verifications", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	otp: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 255 }).notNull(),
	userId: bigint("user_id", { mode: "number" }).default(sql`null`).references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" }),
	expiredAt: timestamp("expired_at", { mode: 'string' }).default(sql`null`),
	verifiedAt: timestamp("verified_at", { mode: 'string' }).default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			otpVerificationsPhoneNumberUnique: unique("otp_verifications_phone_number_unique").on(table.phoneNumber),
		}
	});

export const packages = mysqlTable("packages", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	price: double().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	sessionPerWeek: int("session_per_week").default(0).notNull(),
	sessionDuration: int("session_duration").default(sql`null`),
	programId: bigint("program_id", { mode: "number" }).notNull().references(() => programs.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const pages = mysqlTable("pages", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	orderBy: varchar("order_by", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	image: varchar({ length: 255 }).default(sql`null`),
});

export const pageTranslations = mysqlTable("page_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	pageId: bigint("page_id", { mode: "number" }).notNull().references(() => pages.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).default(sql`null`),
	content: text().default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			pageTranslationsPageIdLocaleUnique: unique("page_translations_page_id_locale_unique").on(table.pageId, table.locale),
		}
	});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
	email: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
});

export const payments = mysqlTable("payments", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	resourceableType: varchar("resourceable_type", { length: 255 }).notNull(),
	resourceableId: bigint("resourceable_id", { mode: "number" }).notNull(),
	price: double().notNull(),
	paymentMethod: varchar("payment_method", { length: 255 }).default(sql`null`),
	merchantReferenceNumber: varchar("merchant_reference_number", { length: 255 }).default(sql`null`),
	status: varchar({ length: 255 }).default('pending').notNull(),
	referableType: varchar("referable_type", { length: 255 }).notNull(),
	referableId: bigint("referable_id", { mode: "number" }).notNull(),
	// Warning: Can't parse uuid from database
	// uuidType: uuid("reference_number").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			resourceableTypeResourceableIdIdx: index('payments_resourceable_type_resourceable_id_index').on(table.resourceableType, table.resourceableId),
			referableTypeReferableIdIdx: index('payments_referable_type_referable_id_index').on(table.referableType, table.referableId),
		}
	});

export const permissions = mysqlTable("permissions", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	guardName: varchar("guard_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	label: varchar({ length: 255 }).default(sql`null`),
},
	(table) => {
		return {
			permissionsNameGuardNameUnique: unique("permissions_name_guard_name_unique").on(table.name, table.guardName),
		}
	});

export const personalAccessTokens = mysqlTable("personal_access_tokens", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
	tokenableId: bigint("tokenable_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 64 }).notNull(),
	abilities: text().default(sql`null`),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).default(sql`null`),
	expiresAt: timestamp("expires_at", { mode: 'string' }).default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			tokenableTypeTokenableIdIdx: index('personal_access_tokens_tokenable_type_tokenable_id').on(table.tokenableType, table.tokenableId),
			personalAccessTokensTokenUnique: unique("personal_access_tokens_token_unique").on(table.token),
		}
	});

export const profiles = mysqlTable("profiles", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	gender: varchar({ length: 255 }).default(sql`null`),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthday: date({ mode: 'string' }).default(sql`null`),
	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
	image: varchar({ length: 255 }).default(sql`null`),
	relationship: varchar({ length: 255 }).default('\'primer\'').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			profilesRelationshipBirthdayNameUserIdUnique: unique("profiles_relationship_birthday_name_user_id_unique").on(table.relationship, table.birthday, table.name, table.userId),
		}
	});

export const programs = mysqlTable("programs", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	type: mysqlEnum(['TEAM', 'PRIVATE']).notNull(),
	numberOfSeats: int("number_of_seats").default(sql`null`),
	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "restrict", onUpdate: "restrict" }),
	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
	gender: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }).default(sql`null`),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDateOfBirth: date("start_date_of_birth", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDateOfBirth: date("end_date_of_birth", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const roles = mysqlTable("roles", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	guardName: varchar("guard_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			rolesNameGuardNameUnique: unique("roles_name_guard_name_unique").on(table.name, table.guardName),
		}
	});

export const roleHasPermissions = mysqlTable("role_has_permissions", {
	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "restrict" }),
	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "restrict" }),
});

export const schedules = mysqlTable("schedules", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	day: varchar({ length: 255 }).notNull(),
	from: time().notNull(),
	to: time().notNull(),
	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "restrict", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const sessions = mysqlTable("sessions", {
	id: varchar({ length: 255 }).notNull(),
	userId: bigint("user_id", { mode: "number" }).default(sql`null`),
	ipAddress: varchar("ip_address", { length: 45 }).default(sql`null`),
	userAgent: text("user_agent").default(sql`null`),
	payload: longtext().notNull(),
	lastActivity: int("last_activity").notNull(),
},
	(table) => {
		return {
			userIdIdx: index('sessions_user_id_index').on(table.userId),
			lastActivityIdx: index('sessions_last_activity_index').on(table.lastActivity),
		}
	});

export const settings = mysqlTable("settings", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: longtext().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const spokenLanguages = mysqlTable("spoken_languages", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const spokenLanguageTranslations = mysqlTable("spoken_language_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull().references(() => spokenLanguages.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			spokenLanguageTranslationsSpokenLanguageIdLocaleUnique: unique("spoken_language_translations_spoken_language_id_locale_unique").on(table.spokenLanguageId, table.locale),
		}
	});

export const sports = mysqlTable("sports", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	slug: varchar({ length: 255 }).default(sql`null`),
	image: varchar({ length: 255 }).default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			sportsSlugUnique: unique("sports_slug_unique").on(table.slug),
		}
	});

export const sportTranslations = mysqlTable("sport_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			sportTranslationsSportIdLocaleUnique: unique("sport_translations_sport_id_locale_unique").on(table.sportId, table.locale),
		}
	});

export const states = mysqlTable("states", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	countryId: bigint("country_id", { mode: "number" }).notNull().references(() => countries.id, { onDelete: "cascade", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
});

export const stateTranslations = mysqlTable("state_translations", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	stateId: bigint("state_id", { mode: "number" }).notNull().references(() => states.id, { onDelete: "cascade", onUpdate: "restrict" }),
	locale: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			stateTranslationsStateIdLocaleUnique: unique("state_translations_state_id_locale_unique").on(table.stateId, table.locale),
		}
	});

export const subscriptions = mysqlTable("subscriptions", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number" }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	stripeId: varchar("stripe_id", { length: 255 }).notNull(),
	stripeStatus: varchar("stripe_status", { length: 255 }).notNull(),
	stripePrice: varchar("stripe_price", { length: 255 }).default(sql`null`),
	quantity: int().default(sql`null`),
	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }).default(sql`null`),
	endsAt: timestamp("ends_at", { mode: 'string' }).default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			userIdStripeStatusIdx: index('subscriptions_user_id_stripe_status_inde').on(table.userId, table.stripeStatus),
			subscriptionsStripeIdUnique: unique("subscriptions_stripe_id_unique").on(table.stripeId),
		}
	});

export const subscriptionItems = mysqlTable("subscription_items", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	subscriptionId: bigint("subscription_id", { mode: "number" }).notNull(),
	stripeId: varchar("stripe_id", { length: 255 }).notNull(),
	stripeProduct: varchar("stripe_product", { length: 255 }).notNull(),
	stripePrice: varchar("stripe_price", { length: 255 }).notNull(),
	quantity: int().default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			subscriptionIdStripePriceIdx: index('subscription_items_subscription_id_stripe_price_index').on(table.subscriptionId, table.stripePrice),
			subscriptionItemsStripeIdUnique: unique("subscription_items_stripe_id_unique").on(table.stripeId),
		}
	});

export const users = mysqlTable("users", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	name: varchar({ length: 255 }).default(sql`null`),
	email: varchar({ length: 255 }).default(sql`null`),
	phoneNumber: varchar("phone_number", { length: 255 }).default(sql`null`),
	googleId: varchar("google_id", { length: 255 }).default(sql`null`),
	appleId: varchar("apple_id", { length: 255 }).default(sql`null`),
	isAthletic: tinyint("is_athletic").default(0).notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }).default(sql`null`),
	password: varchar({ length: 255 }).default(sql`null`),
	rememberToken: varchar("remember_token", { length: 100 }).default(sql`null`),
	deviceToken: varchar("device_token", { length: 400 }).default(sql`null`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
	stripeId: varchar("stripe_id", { length: 255 }).default(sql`null`),
	pmType: varchar("pm_type", { length: 255 }).default(sql`null`),
	pmLastFour: varchar("pm_last_four", { length: 4 }).default(sql`null`),
	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }).default(sql`null`),
	deletedAt: timestamp("deleted_at", { mode: 'string' }).default(sql`null`),
	role: mysqlEnum(['academic', 'user', 'admin']).default('user').notNull(),
},
	(table) => {
		return {
			stripeIdIdx: index('users_stripe_id_index').on(table.stripeId),
			usersEmailUnique: unique("users_email_unique").on(table.email),
			usersPhoneNumberUnique: unique("users_phone_number_unique").on(table.phoneNumber),
		}
	});

export const wishlist = mysqlTable("wishlist", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" }),
	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
},
	(table) => {
		return {
			wishlistUserIdAcademicIdUnique: unique("wishlist_user_id_academic_id_unique").on(table.userId, table.academicId),
		}
	});

export const academicsRelations = relations(academics, ({ one, many }) => ({
	user: one(users, {
		fields: [academics.userId],
		references: [users.id]
	}),
	academicAthletics: many(academicAthletic),
	academicSports: many(academicSport),
	academicTranslations: many(academicTranslations),
	branches: many(branches),
	coaches: many(coaches),
	wishlists: many(wishlist),
}));

export const usersRelations = relations(users, ({ many }) => ({
	academics: many(academics),
	academicAthletics: many(academicAthletic),
	addresses: many(addresses),
	otpVerifications: many(otpVerifications),
	profiles: many(profiles),
	wishlists: many(wishlist),
}));

export const academicAthleticRelations = relations(academicAthletic, ({ one }) => ({
	academic: one(academics, {
		fields: [academicAthletic.academicId],
		references: [academics.id]
	}),
	profile: one(profiles, {
		fields: [academicAthletic.profileId],
		references: [profiles.id]
	}),
	sport: one(sports, {
		fields: [academicAthletic.sportId],
		references: [sports.id]
	}),
	user: one(users, {
		fields: [academicAthletic.userId],
		references: [users.id]
	}),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
	academicAthletics: many(academicAthletic),
	bookings: many(bookings),
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id]
	}),
}));

export const sportsRelations = relations(sports, ({ many }) => ({
	academicAthletics: many(academicAthletic),
	academicSports: many(academicSport),
	branchSports: many(branchSport),
	coachSports: many(coachSport),
	programs: many(programs),
	sportTranslations: many(sportTranslations),
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

export const academicTranslationsRelations = relations(academicTranslations, ({ one }) => ({
	academic: one(academics, {
		fields: [academicTranslations.academicId],
		references: [academics.id]
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

export const citiesRelations = relations(cities, ({ one, many }) => ({
	addresses: many(addresses),
	state: one(states, {
		fields: [cities.stateId],
		references: [states.id]
	}),
	cityTranslations: many(cityTranslations),
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
}));

export const coachesRelations = relations(coaches, ({ one, many }) => ({
	bookings: many(bookings),
	academic: one(academics, {
		fields: [coaches.academicId],
		references: [academics.id]
	}),
	coachPackages: many(coachPackage),
	coachPrograms: many(coachProgram),
	coachSpokenLanguages: many(coachSpokenLanguage),
	coachSports: many(coachSport),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
	bookings: many(bookings),
	coachPackages: many(coachPackage),
	program: one(programs, {
		fields: [packages.programId],
		references: [programs.id]
	}),
	schedules: many(schedules),
}));

export const bookingSessionsRelations = relations(bookingSessions, ({ one }) => ({
	booking: one(bookings, {
		fields: [bookingSessions.bookingId],
		references: [bookings.id]
	}),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
	academic: one(academics, {
		fields: [branches.academicId],
		references: [academics.id]
	}),
	branchFacilities: many(branchFacility),
	branchSports: many(branchSport),
	branchTranslations: many(branchTranslations),
	programs: many(programs),
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

export const facilitiesRelations = relations(facilities, ({ many }) => ({
	branchFacilities: many(branchFacility),
	facilityTranslations: many(facilityTranslations),
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

export const branchTranslationsRelations = relations(branchTranslations, ({ one }) => ({
	branch: one(branches, {
		fields: [branchTranslations.branchId],
		references: [branches.id]
	}),
}));

export const statesRelations = relations(states, ({ one, many }) => ({
	cities: many(cities),
	country: one(countries, {
		fields: [states.countryId],
		references: [countries.id]
	}),
	stateTranslations: many(stateTranslations),
}));

export const cityTranslationsRelations = relations(cityTranslations, ({ one }) => ({
	city: one(cities, {
		fields: [cityTranslations.cityId],
		references: [cities.id]
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

export const programsRelations = relations(programs, ({ one, many }) => ({
	coachPrograms: many(coachProgram),
	packages: many(packages),
	branch: one(branches, {
		fields: [programs.branchId],
		references: [branches.id]
	}),
	sport: one(sports, {
		fields: [programs.sportId],
		references: [sports.id]
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

export const spokenLanguagesRelations = relations(spokenLanguages, ({ many }) => ({
	coachSpokenLanguages: many(coachSpokenLanguage),
	spokenLanguageTranslations: many(spokenLanguageTranslations),
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

export const facilityTranslationsRelations = relations(facilityTranslations, ({ one }) => ({
	facility: one(facilities, {
		fields: [facilityTranslations.facilityId],
		references: [facilities.id]
	}),
}));

export const modelHasPermissionsRelations = relations(modelHasPermissions, ({ one }) => ({
	permission: one(permissions, {
		fields: [modelHasPermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
	modelHasPermissions: many(modelHasPermissions),
	roleHasPermissions: many(roleHasPermissions),
}));

export const modelHasRolesRelations = relations(modelHasRoles, ({ one }) => ({
	role: one(roles, {
		fields: [modelHasRoles.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	modelHasRoles: many(modelHasRoles),
	roleHasPermissions: many(roleHasPermissions),
}));

export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
	user: one(users, {
		fields: [otpVerifications.userId],
		references: [users.id]
	}),
}));

export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
	page: one(pages, {
		fields: [pageTranslations.pageId],
		references: [pages.id]
	}),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
	pageTranslations: many(pageTranslations),
}));

export const roleHasPermissionsRelations = relations(roleHasPermissions, ({ one }) => ({
	permission: one(permissions, {
		fields: [roleHasPermissions.permissionId],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [roleHasPermissions.roleId],
		references: [roles.id]
	}),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
	package: one(packages, {
		fields: [schedules.packageId],
		references: [packages.id]
	}),
}));

export const spokenLanguageTranslationsRelations = relations(spokenLanguageTranslations, ({ one }) => ({
	spokenLanguage: one(spokenLanguages, {
		fields: [spokenLanguageTranslations.spokenLanguageId],
		references: [spokenLanguages.id]
	}),
}));

export const sportTranslationsRelations = relations(sportTranslations, ({ one }) => ({
	sport: one(sports, {
		fields: [sportTranslations.sportId],
		references: [sports.id]
	}),
}));

export const stateTranslationsRelations = relations(stateTranslations, ({ one }) => ({
	state: one(states, {
		fields: [stateTranslations.stateId],
		references: [states.id]
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