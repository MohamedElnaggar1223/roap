// // import { sql } from "drizzle-orm";
// // import { mysqlTable, unique, varchar, double, timestamp, longtext, text, mysqlEnum, date, int, mediumtext, index, time, bigint, tinyint } from "drizzle-orm/mysql-core"
// // import { relations } from "drizzle-orm/relations";

// // export const academics = mysqlTable("academics", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	slug: varchar({ length: 255 }).notNull(),
// // 	entryFees: double("entry_fees").notNull(),
// // 	userId: bigint("user_id", { mode: "number" }).default(sql`null`).references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	image: varchar({ length: 255 }).default(sql`null`),
// // 	policy: longtext().default(sql`null`),
// // 	status: mysqlEnum(['pending', 'accepted', 'rejected']).default('pending').notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			academicsSlugUnique: unique("academics_slug_unique").on(table.slug),
// // 		}
// // 	});

// // export const academicAthletic = mysqlTable("academic_athletic", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	profileId: bigint("profile_id", { mode: "number" }).default(sql`null`).references(() => profiles.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	sportId: bigint("sport_id", { mode: "number" }).default(sql`null`).references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const academicSport = mysqlTable("academic_sport", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const academicTranslations = mysqlTable("academic_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).default(sql`null`),
// // 	description: text().default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			academicTranslationsAcademicIdLocaleUnique: unique("academic_translations_academic_id_locale_unique").on(table.academicId, table.locale),
// // 		}
// // 	});

// // export const addresses = mysqlTable("addresses", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	streetAddress: varchar("street_address", { length: 255 }).notNull(),
// // 	postalCode: varchar("postal_code", { length: 255 }).default(sql`null`),
// // 	cityId: bigint("city_id", { mode: "number" }).notNull().references(() => cities.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			addressesUserIdUnique: unique("addresses_user_id_unique").on(table.userId),
// // 		}
// // 	});

// // export const bookings = mysqlTable("bookings", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	status: mysqlEnum(['success', 'rejected', 'pending']).default('pending').notNull(),
// // 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	profileId: bigint("profile_id", { mode: "number" }).default(sql`null`).references(() => profiles.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	price: double().notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	academyPolicy: tinyint("academy_policy").default(0).notNull(),
// // 	roapPolicy: tinyint("roap_policy").default(0).notNull(),
// // 	packagePrice: double("package_price").notNull(),
// // });

// // export const bookingSessions = mysqlTable("booking_sessions", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	date: date({ mode: 'string' }).notNull(),
// // 	from: varchar({ length: 255 }).notNull(),
// // 	to: varchar({ length: 255 }).notNull(),
// // 	status: mysqlEnum(['pending', 'accepted', 'upcoming', 'rejected', 'cancelled']).default('pending').notNull(),
// // 	bookingId: bigint("booking_id", { mode: "number" }).notNull().references(() => bookings.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const branches = mysqlTable("branches", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	slug: varchar({ length: 255 }).notNull(),
// // 	latitude: varchar({ length: 255 }).default(sql`null`),
// // 	longitude: varchar({ length: 255 }).default(sql`null`),
// // 	isDefault: tinyint("is_default").default(0).notNull(),
// // 	rate: double().default(sql`null`),
// // 	reviews: int().default(sql`null`),
// // 	academicId: bigint("academic_id", { mode: "number" }).default(sql`null`).references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	url: varchar({ length: 255 }).default(sql`null`),
// // 	placeId: varchar("place_id", { length: 255 }).default(sql`null`),
// // 	nameInGoogleMap: varchar("name_in_google_map", { length: 255 }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			branchesSlugUnique: unique("branches_slug_unique").on(table.slug),
// // 		}
// // 	});

// // export const branchFacility = mysqlTable("branch_facility", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	facilityId: bigint("facility_id", { mode: "number" }).notNull().references(() => facilities.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const branchSport = mysqlTable("branch_sport", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const branchTranslations = mysqlTable("branch_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			branchTranslationsBranchIdLocaleUnique: unique("branch_translations_branch_id_locale_unique").on(table.branchId, table.locale),
// // 		}
// // 	});

// // export const cache = mysqlTable("cache", {
// // 	key: varchar({ length: 255 }).notNull(),
// // 	value: mediumtext().notNull(),
// // 	expiration: int().notNull(),
// // });

// // export const cacheLocks = mysqlTable("cache_locks", {
// // 	key: varchar({ length: 255 }).notNull(),
// // 	owner: varchar({ length: 255 }).notNull(),
// // 	expiration: int().notNull(),
// // });

// // export const cities = mysqlTable("cities", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	stateId: bigint("state_id", { mode: "number" }).notNull().references(() => states.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const cityTranslations = mysqlTable("city_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	cityId: bigint("city_id", { mode: "number" }).notNull().references(() => cities.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			cityTranslationsCityIdLocaleUnique: unique("city_translations_city_id_locale_unique").on(table.cityId, table.locale),
// // 		}
// // 	});

// // export const coaches = mysqlTable("coaches", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	image: varchar({ length: 255 }).default(sql`null`),
// // 	bio: text().default(sql`null`),
// // 	gender: varchar({ length: 255 }).default(sql`null`),
// // 	privateSessionPercentage: varchar("private_session_percentage", { length: 255 }).default(sql`null`),
// // 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	dateOfBirth: date("date_of_birth", { mode: 'string' }).default(sql`null`),
// // });

// // export const coachPackage = mysqlTable("coach_package", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const coachProgram = mysqlTable("coach_program", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	programId: bigint("program_id", { mode: "number" }).notNull().references(() => programs.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const coachSpokenLanguage = mysqlTable("coach_spoken_language", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull().references(() => spokenLanguages.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const coachSport = mysqlTable("coach_sport", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	coachId: bigint("coach_id", { mode: "number" }).notNull().references(() => coaches.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const countries = mysqlTable("countries", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const countryTranslations = mysqlTable("country_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	countryId: bigint("country_id", { mode: "number" }).notNull().references(() => countries.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			countryTranslationsCountryIdLocaleUnique: unique("country_translations_country_id_locale_unique").on(table.countryId, table.locale),
// // 		}
// // 	});

// // export const facilities = mysqlTable("facilities", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const facilityTranslations = mysqlTable("facility_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	facilityId: bigint("facility_id", { mode: "number" }).notNull().references(() => facilities.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			facilityTranslationsFacilityIdLocaleUnique: unique("facility_translations_facility_id_locale_unique").on(table.facilityId, table.locale),
// // 		}
// // 	});

// // export const failedJobs = mysqlTable("failed_jobs", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	uuid: varchar({ length: 255 }).notNull(),
// // 	connection: text().notNull(),
// // 	queue: text().notNull(),
// // 	payload: longtext().notNull(),
// // 	exception: longtext().notNull(),
// // 	failedAt: timestamp("failed_at", { mode: 'string' }).default('current_timestamp()').notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			failedJobsUuidUnique: unique("failed_jobs_uuid_unique").on(table.uuid),
// // 		}
// // 	});

// // export const jobs = mysqlTable("jobs", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	queue: varchar({ length: 255 }).notNull(),
// // 	payload: longtext().notNull(),
// // 	attempts: tinyint().notNull(),
// // 	reservedAt: int("reserved_at").default(sql`null`),
// // 	availableAt: int("available_at").notNull(),
// // 	createdAt: int("created_at").notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			queueIdx: index('jobs_queue_index').on(table.queue),
// // 		}
// // 	});

// // export const jobBatches = mysqlTable("job_batches", {
// // 	id: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	totalJobs: int("total_jobs").notNull(),
// // 	pendingJobs: int("pending_jobs").notNull(),
// // 	failedJobs: int("failed_jobs").notNull(),
// // 	failedJobIds: longtext("failed_job_ids").notNull(),
// // 	options: mediumtext().default(sql`null`),
// // 	cancelledAt: int("cancelled_at").default(sql`null`),
// // 	createdAt: int("created_at").notNull(),
// // 	finishedAt: int("finished_at").default(sql`null`),
// // });

// // export const joinUs = mysqlTable("join_us", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	email: varchar({ length: 255 }).notNull(),
// // 	phone: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			joinUsPhoneEmailUnique: unique("join_us_phone_email_unique").on(table.phone, table.email),
// // 		}
// // 	});

// // export const media = mysqlTable("media", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	referableType: varchar("referable_type", { length: 255 }).notNull(),
// // 	referableId: bigint("referable_id", { mode: "number" }).notNull(),
// // 	url: varchar({ length: 255 }).notNull(),
// // 	type: varchar({ length: 255 }).default('\'0\'').notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			referableTypeReferableIdIdx: index('media_referable_type_referable_id_index').on(table.referableType, table.referableId),
// // 		}
// // 	});

// // export const migrations = mysqlTable("migrations", {
// // 	id: int().autoincrement().notNull(),
// // 	migration: varchar({ length: 255 }).notNull(),
// // 	batch: int().notNull(),
// // });

// // export const modelHasPermissions = mysqlTable("model_has_permissions", {
// // 	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	modelType: varchar("model_type", { length: 255 }).notNull(),
// // 	modelId: bigint("model_id", { mode: "number" }).notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			modelIdModelTypeIdx: index('model_has_permissions_model_id_model_type_index').on(table.modelId, table.modelType),
// // 		}
// // 	});

// // export const modelHasRoles = mysqlTable("model_has_roles", {
// // 	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	modelType: varchar("model_type", { length: 255 }).notNull(),
// // 	modelId: bigint("model_id", { mode: "number" }).notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			modelIdModelTypeIdx: index('model_has_roles_model_id_model_type_index').on(table.modelId, table.modelType),
// // 		}
// // 	});

// // export const notifications = mysqlTable("notifications", {
// // 	// Warning: Can't parse uuid from database
// // 	// uuidType: uuid("id").notNull(),
// // 	type: varchar({ length: 255 }).notNull(),
// // 	notifiableType: varchar("notifiable_type", { length: 255 }).notNull(),
// // 	notifiableId: bigint("notifiable_id", { mode: "number" }).notNull(),
// // 	data: text().notNull(),
// // 	readAt: timestamp("read_at", { mode: 'string' }).default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			notifiableTypeNotifiableIdIdx: index('notifications_notifiable_type_notifiable_id_index').on(table.notifiableType, table.notifiableId),
// // 		}
// // 	});

// // export const otpVerifications = mysqlTable("otp_verifications", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	otp: varchar({ length: 255 }).notNull(),
// // 	phoneNumber: varchar("phone_number", { length: 255 }).notNull(),
// // 	userId: bigint("user_id", { mode: "number" }).default(sql`null`).references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	expiredAt: timestamp("expired_at", { mode: 'string' }).default(sql`null`),
// // 	verifiedAt: timestamp("verified_at", { mode: 'string' }).default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			otpVerificationsPhoneNumberUnique: unique("otp_verifications_phone_number_unique").on(table.phoneNumber),
// // 		}
// // 	});

// // export const packages = mysqlTable("packages", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	price: double().notNull(),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	startDate: date("start_date", { mode: 'string' }).notNull(),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	endDate: date("end_date", { mode: 'string' }).notNull(),
// // 	sessionPerWeek: int("session_per_week").default(0).notNull(),
// // 	sessionDuration: int("session_duration").default(sql`null`),
// // 	programId: bigint("program_id", { mode: "number" }).notNull().references(() => programs.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const pages = mysqlTable("pages", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	orderBy: varchar("order_by", { length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	image: varchar({ length: 255 }).default(sql`null`),
// // });

// // export const pageTranslations = mysqlTable("page_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	pageId: bigint("page_id", { mode: "number" }).notNull().references(() => pages.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	title: varchar({ length: 255 }).default(sql`null`),
// // 	content: text().default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			pageTranslationsPageIdLocaleUnique: unique("page_translations_page_id_locale_unique").on(table.pageId, table.locale),
// // 		}
// // 	});

// // export const passwordResetTokens = mysqlTable("password_reset_tokens", {
// // 	email: varchar({ length: 255 }).notNull(),
// // 	token: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const payments = mysqlTable("payments", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	resourceableType: varchar("resourceable_type", { length: 255 }).notNull(),
// // 	resourceableId: bigint("resourceable_id", { mode: "number" }).notNull(),
// // 	price: double().notNull(),
// // 	paymentMethod: varchar("payment_method", { length: 255 }).default(sql`null`),
// // 	merchantReferenceNumber: varchar("merchant_reference_number", { length: 255 }).default(sql`null`),
// // 	status: varchar({ length: 255 }).default('pending').notNull(),
// // 	referableType: varchar("referable_type", { length: 255 }).notNull(),
// // 	referableId: bigint("referable_id", { mode: "number" }).notNull(),
// // 	// Warning: Can't parse uuid from database
// // 	// uuidType: uuid("reference_number").notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			resourceableTypeResourceableIdIdx: index('payments_resourceable_type_resourceable_id_index').on(table.resourceableType, table.resourceableId),
// // 			referableTypeReferableIdIdx: index('payments_referable_type_referable_id_index').on(table.referableType, table.referableId),
// // 		}
// // 	});

// // export const permissions = mysqlTable("permissions", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	guardName: varchar("guard_name", { length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	label: varchar({ length: 255 }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			permissionsNameGuardNameUnique: unique("permissions_name_guard_name_unique").on(table.name, table.guardName),
// // 		}
// // 	});

// // export const personalAccessTokens = mysqlTable("personal_access_tokens", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
// // 	tokenableId: bigint("tokenable_id", { mode: "number" }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	token: varchar({ length: 64 }).notNull(),
// // 	abilities: text().default(sql`null`),
// // 	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).default(sql`null`),
// // 	expiresAt: timestamp("expires_at", { mode: 'string' }).default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			tokenableTypeTokenableIdIdx: index('personal_access_tokens_tokenable_type_tokenable_id').on(table.tokenableType, table.tokenableId),
// // 			personalAccessTokensTokenUnique: unique("personal_access_tokens_token_unique").on(table.token),
// // 		}
// // 	});

// // export const profiles = mysqlTable("profiles", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	gender: varchar({ length: 255 }).default(sql`null`),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	birthday: date({ mode: 'string' }).default(sql`null`),
// // 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	image: varchar({ length: 255 }).default(sql`null`),
// // 	relationship: varchar({ length: 255 }).default('\'primer\'').notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			profilesRelationshipBirthdayNameUserIdUnique: unique("profiles_relationship_birthday_name_user_id_unique").on(table.relationship, table.birthday, table.name, table.userId),
// // 		}
// // 	});

// // export const programs = mysqlTable("programs", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	type: mysqlEnum(['TEAM', 'PRIVATE']).notNull(),
// // 	numberOfSeats: int("number_of_seats").default(sql`null`),
// // 	branchId: bigint("branch_id", { mode: "number" }).notNull().references(() => branches.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	gender: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	description: varchar({ length: 255 }).default(sql`null`),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	startDateOfBirth: date("start_date_of_birth", { mode: 'string' }).notNull(),
// // 	// you can use { mode: 'date' }, if you want to have Date as type for this column
// // 	endDateOfBirth: date("end_date_of_birth", { mode: 'string' }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const roles = mysqlTable("roles", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	guardName: varchar("guard_name", { length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			rolesNameGuardNameUnique: unique("roles_name_guard_name_unique").on(table.name, table.guardName),
// // 		}
// // 	});

// // export const roleHasPermissions = mysqlTable("role_has_permissions", {
// // 	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // });

// // export const schedules = mysqlTable("schedules", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	day: varchar({ length: 255 }).notNull(),
// // 	from: time().notNull(),
// // 	to: time().notNull(),
// // 	packageId: bigint("package_id", { mode: "number" }).notNull().references(() => packages.id, { onDelete: "restrict", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const sessions = mysqlTable("sessions", {
// // 	id: varchar({ length: 255 }).notNull(),
// // 	userId: bigint("user_id", { mode: "number" }).default(sql`null`),
// // 	ipAddress: varchar("ip_address", { length: 45 }).default(sql`null`),
// // 	userAgent: text("user_agent").default(sql`null`),
// // 	payload: longtext().notNull(),
// // 	lastActivity: int("last_activity").notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			userIdIdx: index('sessions_user_id_index').on(table.userId),
// // 			lastActivityIdx: index('sessions_last_activity_index').on(table.lastActivity),
// // 		}
// // 	});

// // export const settings = mysqlTable("settings", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	key: varchar({ length: 255 }).notNull(),
// // 	value: longtext().notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const spokenLanguages = mysqlTable("spoken_languages", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const spokenLanguageTranslations = mysqlTable("spoken_language_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull().references(() => spokenLanguages.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			spokenLanguageTranslationsSpokenLanguageIdLocaleUnique: unique("spoken_language_translations_spoken_language_id_locale_unique").on(table.spokenLanguageId, table.locale),
// // 		}
// // 	});

// // export const sports = mysqlTable("sports", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	slug: varchar({ length: 255 }).default(sql`null`),
// // 	image: varchar({ length: 255 }).default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			sportsSlugUnique: unique("sports_slug_unique").on(table.slug),
// // 		}
// // 	});

// // export const sportTranslations = mysqlTable("sport_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	sportId: bigint("sport_id", { mode: "number" }).notNull().references(() => sports.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			sportTranslationsSportIdLocaleUnique: unique("sport_translations_sport_id_locale_unique").on(table.sportId, table.locale),
// // 		}
// // 	});

// // export const states = mysqlTable("states", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	countryId: bigint("country_id", { mode: "number" }).notNull().references(() => countries.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // });

// // export const stateTranslations = mysqlTable("state_translations", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	stateId: bigint("state_id", { mode: "number" }).notNull().references(() => states.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	locale: varchar({ length: 255 }).notNull(),
// // 	name: varchar({ length: 255 }).notNull(),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			stateTranslationsStateIdLocaleUnique: unique("state_translations_state_id_locale_unique").on(table.stateId, table.locale),
// // 		}
// // 	});

// // export const subscriptions = mysqlTable("subscriptions", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	userId: bigint("user_id", { mode: "number" }).notNull(),
// // 	type: varchar({ length: 255 }).notNull(),
// // 	stripeId: varchar("stripe_id", { length: 255 }).notNull(),
// // 	stripeStatus: varchar("stripe_status", { length: 255 }).notNull(),
// // 	stripePrice: varchar("stripe_price", { length: 255 }).default(sql`null`),
// // 	quantity: int().default(sql`null`),
// // 	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }).default(sql`null`),
// // 	endsAt: timestamp("ends_at", { mode: 'string' }).default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			userIdStripeStatusIdx: index('subscriptions_user_id_stripe_status_inde').on(table.userId, table.stripeStatus),
// // 			subscriptionsStripeIdUnique: unique("subscriptions_stripe_id_unique").on(table.stripeId),
// // 		}
// // 	});

// // export const subscriptionItems = mysqlTable("subscription_items", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	subscriptionId: bigint("subscription_id", { mode: "number" }).notNull(),
// // 	stripeId: varchar("stripe_id", { length: 255 }).notNull(),
// // 	stripeProduct: varchar("stripe_product", { length: 255 }).notNull(),
// // 	stripePrice: varchar("stripe_price", { length: 255 }).notNull(),
// // 	quantity: int().default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			subscriptionIdStripePriceIdx: index('subscription_items_subscription_id_stripe_price_index').on(table.subscriptionId, table.stripePrice),
// // 			subscriptionItemsStripeIdUnique: unique("subscription_items_stripe_id_unique").on(table.stripeId),
// // 		}
// // 	});

// // export const users = mysqlTable("users", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull().primaryKey(),
// // 	name: varchar({ length: 255 }).default(sql`null`),
// // 	email: varchar({ length: 255 }).default(sql`null`),
// // 	phoneNumber: varchar("phone_number", { length: 255 }).default(sql`null`),
// // 	googleId: varchar("google_id", { length: 255 }).default(sql`null`),
// // 	appleId: varchar("apple_id", { length: 255 }).default(sql`null`),
// // 	isAthletic: tinyint("is_athletic").default(0).notNull(),
// // 	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }).default(sql`null`),
// // 	password: varchar({ length: 255 }).default(sql`null`),
// // 	rememberToken: varchar("remember_token", { length: 100 }).default(sql`null`),
// // 	deviceToken: varchar("device_token", { length: 400 }).default(sql`null`),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // 	stripeId: varchar("stripe_id", { length: 255 }).default(sql`null`),
// // 	pmType: varchar("pm_type", { length: 255 }).default(sql`null`),
// // 	pmLastFour: varchar("pm_last_four", { length: 4 }).default(sql`null`),
// // 	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }).default(sql`null`),
// // 	deletedAt: timestamp("deleted_at", { mode: 'string' }).default(sql`null`),
// // 	role: mysqlEnum(['academic', 'user', 'admin']).default('user').notNull(),
// // },
// // 	(table) => {
// // 		return {
// // 			stripeIdIdx: index('users_stripe_id_index').on(table.stripeId),
// // 			usersEmailUnique: unique("users_email_unique").on(table.email),
// // 			usersPhoneNumberUnique: unique("users_phone_number_unique").on(table.phoneNumber),
// // 		}
// // 	});

// // export const wishlist = mysqlTable("wishlist", {
// // 	id: bigint({ mode: "number" }).autoincrement().notNull(),
// // 	academicId: bigint("academic_id", { mode: "number" }).notNull().references(() => academics.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	userId: bigint("user_id", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "restrict" }),
// // 	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`null`),
// // 	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`null`),
// // },
// // 	(table) => {
// // 		return {
// // 			wishlistUserIdAcademicIdUnique: unique("wishlist_user_id_academic_id_unique").on(table.userId, table.academicId),
// // 		}
// // 	});

// // export const academicsRelations = relations(academics, ({ one, many }) => ({
// // 	user: one(users, {
// // 		fields: [academics.userId],
// // 		references: [users.id]
// // 	}),
// // 	academicAthletics: many(academicAthletic),
// // 	academicSports: many(academicSport),
// // 	academicTranslations: many(academicTranslations),
// // 	branches: many(branches),
// // 	coaches: many(coaches),
// // 	wishlists: many(wishlist),
// // }));

// // export const usersRelations = relations(users, ({ many }) => ({
// // 	academics: many(academics),
// // 	academicAthletics: many(academicAthletic),
// // 	addresses: many(addresses),
// // 	otpVerifications: many(otpVerifications),
// // 	profiles: many(profiles),
// // 	wishlists: many(wishlist),
// // }));

// // export const academicAthleticRelations = relations(academicAthletic, ({ one }) => ({
// // 	academic: one(academics, {
// // 		fields: [academicAthletic.academicId],
// // 		references: [academics.id]
// // 	}),
// // 	profile: one(profiles, {
// // 		fields: [academicAthletic.profileId],
// // 		references: [profiles.id]
// // 	}),
// // 	sport: one(sports, {
// // 		fields: [academicAthletic.sportId],
// // 		references: [sports.id]
// // 	}),
// // 	user: one(users, {
// // 		fields: [academicAthletic.userId],
// // 		references: [users.id]
// // 	}),
// // }));

// // export const profilesRelations = relations(profiles, ({ one, many }) => ({
// // 	academicAthletics: many(academicAthletic),
// // 	bookings: many(bookings),
// // 	user: one(users, {
// // 		fields: [profiles.userId],
// // 		references: [users.id]
// // 	}),
// // }));

// // export const sportsRelations = relations(sports, ({ many }) => ({
// // 	academicAthletics: many(academicAthletic),
// // 	academicSports: many(academicSport),
// // 	branchSports: many(branchSport),
// // 	coachSports: many(coachSport),
// // 	programs: many(programs),
// // 	sportTranslations: many(sportTranslations),
// // }));

// // export const academicSportRelations = relations(academicSport, ({ one }) => ({
// // 	academic: one(academics, {
// // 		fields: [academicSport.academicId],
// // 		references: [academics.id]
// // 	}),
// // 	sport: one(sports, {
// // 		fields: [academicSport.sportId],
// // 		references: [sports.id]
// // 	}),
// // }));

// // export const academicTranslationsRelations = relations(academicTranslations, ({ one }) => ({
// // 	academic: one(academics, {
// // 		fields: [academicTranslations.academicId],
// // 		references: [academics.id]
// // 	}),
// // }));

// // export const addressesRelations = relations(addresses, ({ one }) => ({
// // 	city: one(cities, {
// // 		fields: [addresses.cityId],
// // 		references: [cities.id]
// // 	}),
// // 	user: one(users, {
// // 		fields: [addresses.userId],
// // 		references: [users.id]
// // 	}),
// // }));

// // export const citiesRelations = relations(cities, ({ one, many }) => ({
// // 	addresses: many(addresses),
// // 	state: one(states, {
// // 		fields: [cities.stateId],
// // 		references: [states.id]
// // 	}),
// // 	cityTranslations: many(cityTranslations),
// // }));

// // export const bookingsRelations = relations(bookings, ({ one, many }) => ({
// // 	coach: one(coaches, {
// // 		fields: [bookings.coachId],
// // 		references: [coaches.id]
// // 	}),
// // 	package: one(packages, {
// // 		fields: [bookings.packageId],
// // 		references: [packages.id]
// // 	}),
// // 	profile: one(profiles, {
// // 		fields: [bookings.profileId],
// // 		references: [profiles.id]
// // 	}),
// // 	bookingSessions: many(bookingSessions),
// // }));

// // export const coachesRelations = relations(coaches, ({ one, many }) => ({
// // 	bookings: many(bookings),
// // 	academic: one(academics, {
// // 		fields: [coaches.academicId],
// // 		references: [academics.id]
// // 	}),
// // 	coachPackages: many(coachPackage),
// // 	coachPrograms: many(coachProgram),
// // 	coachSpokenLanguages: many(coachSpokenLanguage),
// // 	coachSports: many(coachSport),
// // }));

// // export const packagesRelations = relations(packages, ({ one, many }) => ({
// // 	bookings: many(bookings),
// // 	coachPackages: many(coachPackage),
// // 	program: one(programs, {
// // 		fields: [packages.programId],
// // 		references: [programs.id]
// // 	}),
// // 	schedules: many(schedules),
// // }));

// // export const bookingSessionsRelations = relations(bookingSessions, ({ one }) => ({
// // 	booking: one(bookings, {
// // 		fields: [bookingSessions.bookingId],
// // 		references: [bookings.id]
// // 	}),
// // }));

// // export const branchesRelations = relations(branches, ({ one, many }) => ({
// // 	academic: one(academics, {
// // 		fields: [branches.academicId],
// // 		references: [academics.id]
// // 	}),
// // 	branchFacilities: many(branchFacility),
// // 	branchSports: many(branchSport),
// // 	branchTranslations: many(branchTranslations),
// // 	programs: many(programs),
// // }));

// // export const branchFacilityRelations = relations(branchFacility, ({ one }) => ({
// // 	branch: one(branches, {
// // 		fields: [branchFacility.branchId],
// // 		references: [branches.id]
// // 	}),
// // 	facility: one(facilities, {
// // 		fields: [branchFacility.facilityId],
// // 		references: [facilities.id]
// // 	}),
// // }));

// // export const facilitiesRelations = relations(facilities, ({ many }) => ({
// // 	branchFacilities: many(branchFacility),
// // 	facilityTranslations: many(facilityTranslations),
// // }));

// // export const branchSportRelations = relations(branchSport, ({ one }) => ({
// // 	branch: one(branches, {
// // 		fields: [branchSport.branchId],
// // 		references: [branches.id]
// // 	}),
// // 	sport: one(sports, {
// // 		fields: [branchSport.sportId],
// // 		references: [sports.id]
// // 	}),
// // }));

// // export const branchTranslationsRelations = relations(branchTranslations, ({ one }) => ({
// // 	branch: one(branches, {
// // 		fields: [branchTranslations.branchId],
// // 		references: [branches.id]
// // 	}),
// // }));

// // export const statesRelations = relations(states, ({ one, many }) => ({
// // 	cities: many(cities),
// // 	country: one(countries, {
// // 		fields: [states.countryId],
// // 		references: [countries.id]
// // 	}),
// // 	stateTranslations: many(stateTranslations),
// // }));

// // export const cityTranslationsRelations = relations(cityTranslations, ({ one }) => ({
// // 	city: one(cities, {
// // 		fields: [cityTranslations.cityId],
// // 		references: [cities.id]
// // 	}),
// // }));

// // export const coachPackageRelations = relations(coachPackage, ({ one }) => ({
// // 	coach: one(coaches, {
// // 		fields: [coachPackage.coachId],
// // 		references: [coaches.id]
// // 	}),
// // 	package: one(packages, {
// // 		fields: [coachPackage.packageId],
// // 		references: [packages.id]
// // 	}),
// // }));

// // export const coachProgramRelations = relations(coachProgram, ({ one }) => ({
// // 	coach: one(coaches, {
// // 		fields: [coachProgram.coachId],
// // 		references: [coaches.id]
// // 	}),
// // 	program: one(programs, {
// // 		fields: [coachProgram.programId],
// // 		references: [programs.id]
// // 	}),
// // }));

// // export const programsRelations = relations(programs, ({ one, many }) => ({
// // 	coachPrograms: many(coachProgram),
// // 	packages: many(packages),
// // 	branch: one(branches, {
// // 		fields: [programs.branchId],
// // 		references: [branches.id]
// // 	}),
// // 	sport: one(sports, {
// // 		fields: [programs.sportId],
// // 		references: [sports.id]
// // 	}),
// // }));

// // export const coachSpokenLanguageRelations = relations(coachSpokenLanguage, ({ one }) => ({
// // 	coach: one(coaches, {
// // 		fields: [coachSpokenLanguage.coachId],
// // 		references: [coaches.id]
// // 	}),
// // 	spokenLanguage: one(spokenLanguages, {
// // 		fields: [coachSpokenLanguage.spokenLanguageId],
// // 		references: [spokenLanguages.id]
// // 	}),
// // }));

// // export const spokenLanguagesRelations = relations(spokenLanguages, ({ many }) => ({
// // 	coachSpokenLanguages: many(coachSpokenLanguage),
// // 	spokenLanguageTranslations: many(spokenLanguageTranslations),
// // }));

// // export const coachSportRelations = relations(coachSport, ({ one }) => ({
// // 	coach: one(coaches, {
// // 		fields: [coachSport.coachId],
// // 		references: [coaches.id]
// // 	}),
// // 	sport: one(sports, {
// // 		fields: [coachSport.sportId],
// // 		references: [sports.id]
// // 	}),
// // }));

// // export const countryTranslationsRelations = relations(countryTranslations, ({ one }) => ({
// // 	country: one(countries, {
// // 		fields: [countryTranslations.countryId],
// // 		references: [countries.id]
// // 	}),
// // }));

// // export const countriesRelations = relations(countries, ({ many }) => ({
// // 	countryTranslations: many(countryTranslations),
// // 	states: many(states),
// // }));

// // export const facilityTranslationsRelations = relations(facilityTranslations, ({ one }) => ({
// // 	facility: one(facilities, {
// // 		fields: [facilityTranslations.facilityId],
// // 		references: [facilities.id]
// // 	}),
// // }));

// // export const modelHasPermissionsRelations = relations(modelHasPermissions, ({ one }) => ({
// // 	permission: one(permissions, {
// // 		fields: [modelHasPermissions.permissionId],
// // 		references: [permissions.id]
// // 	}),
// // }));

// // export const permissionsRelations = relations(permissions, ({ many }) => ({
// // 	modelHasPermissions: many(modelHasPermissions),
// // 	roleHasPermissions: many(roleHasPermissions),
// // }));

// // export const modelHasRolesRelations = relations(modelHasRoles, ({ one }) => ({
// // 	role: one(roles, {
// // 		fields: [modelHasRoles.roleId],
// // 		references: [roles.id]
// // 	}),
// // }));

// // export const rolesRelations = relations(roles, ({ many }) => ({
// // 	modelHasRoles: many(modelHasRoles),
// // 	roleHasPermissions: many(roleHasPermissions),
// // }));

// // export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
// // 	user: one(users, {
// // 		fields: [otpVerifications.userId],
// // 		references: [users.id]
// // 	}),
// // }));

// // export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
// // 	page: one(pages, {
// // 		fields: [pageTranslations.pageId],
// // 		references: [pages.id]
// // 	}),
// // }));

// // export const pagesRelations = relations(pages, ({ many }) => ({
// // 	pageTranslations: many(pageTranslations),
// // }));

// // export const roleHasPermissionsRelations = relations(roleHasPermissions, ({ one }) => ({
// // 	permission: one(permissions, {
// // 		fields: [roleHasPermissions.permissionId],
// // 		references: [permissions.id]
// // 	}),
// // 	role: one(roles, {
// // 		fields: [roleHasPermissions.roleId],
// // 		references: [roles.id]
// // 	}),
// // }));

// // export const schedulesRelations = relations(schedules, ({ one }) => ({
// // 	package: one(packages, {
// // 		fields: [schedules.packageId],
// // 		references: [packages.id]
// // 	}),
// // }));

// // export const spokenLanguageTranslationsRelations = relations(spokenLanguageTranslations, ({ one }) => ({
// // 	spokenLanguage: one(spokenLanguages, {
// // 		fields: [spokenLanguageTranslations.spokenLanguageId],
// // 		references: [spokenLanguages.id]
// // 	}),
// // }));

// // export const sportTranslationsRelations = relations(sportTranslations, ({ one }) => ({
// // 	sport: one(sports, {
// // 		fields: [sportTranslations.sportId],
// // 		references: [sports.id]
// // 	}),
// // }));

// // export const stateTranslationsRelations = relations(stateTranslations, ({ one }) => ({
// // 	state: one(states, {
// // 		fields: [stateTranslations.stateId],
// // 		references: [states.id]
// // 	}),
// // }));

// // export const wishlistRelations = relations(wishlist, ({ one }) => ({
// // 	academic: one(academics, {
// // 		fields: [wishlist.academicId],
// // 		references: [academics.id]
// // 	}),
// // 	user: one(users, {
// // 		fields: [wishlist.userId],
// // 		references: [users.id]
// // 	}),
// // }));





















// import { pgTable, uniqueIndex, index, bigint, varchar, boolean, timestamp, unique, foreignKey, date, doublePrecision, text, integer, check, time, uuid, pgEnum } from "drizzle-orm/pg-core"
// import { sql } from "drizzle-orm"
// import { relations } from "drizzle-orm/relations";

// export const status = pgEnum("status", ['pending', 'accepted', 'rejected'])
// export const userRoles = pgEnum("user_roles", ['admin', 'user', 'academic'])
// export const discountType = pgEnum("discount_type", ['fixed', 'percentage'])
// export const athleticType = pgEnum("athletic_type", ['primary', 'fellow'])


// export const users = pgTable("users", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1000 }),
//     name: varchar({ length: 255 }).default(sql`NULL`),
//     email: varchar({ length: 255 }).default(sql`NULL`),
//     phoneNumber: varchar("phone_number", { length: 255 }).default(sql`NULL`),
//     googleId: varchar("google_id", { length: 255 }).default(sql`NULL`),
//     appleId: varchar("apple_id", { length: 255 }).default(sql`NULL`),
//     isAthletic: boolean("is_athletic").default(false).notNull(),
//     emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
//     password: varchar({ length: 255 }).default(sql`NULL`),
//     rememberToken: varchar("remember_token", { length: 100 }).default(sql`NULL`),
//     deviceToken: varchar("device_token", { length: 400 }).default(sql`NULL`),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     stripeId: varchar("stripe_id", { length: 255 }).default(sql`NULL`),
//     pmType: varchar("pm_type", { length: 255 }).default(sql`NULL`),
//     pmLastFour: varchar("pm_last_four", { length: 4 }).default(sql`NULL`),
//     trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
//     deletedAt: timestamp("deleted_at", { mode: 'string' }),
//     role: userRoles().default('user'),
// }, (table) => {
//     return {
//         emailUnique: uniqueIndex("users_email_unique").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`(email IS NOT NULL)`),
//         phoneNumberUnique: uniqueIndex("users_phone_number_unique").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")).where(sql`(phone_number IS NOT NULL)`),
//         stripeIdIdx: index().using("btree", table.stripeId.asc().nullsLast().op("text_ops")),
//     }
// });

// export const joinUs = pgTable("join_us", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "join_us_id_seq", startWith: 1000 }),
//     name: varchar({ length: 255 }).notNull(),
//     email: varchar({ length: 255 }).notNull(),
//     phone: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         joinUsPhoneEmailUnique: unique("join_us_phone_email_unique").on(table.email, table.phone),
//     }
// });

// export const profiles = pgTable("profiles", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "profiles_id_seq", startWith: 1000 }),
//     name: varchar({ length: 255 }).notNull(),
//     gender: varchar({ length: 255 }).default(sql`NULL`),
//     birthday: date(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     userId: bigint("user_id", { mode: "number" }).notNull(),
//     image: varchar({ length: 255 }).default(sql`NULL`),
//     relationship: varchar({ length: 255 }).default('self').notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     nationality: varchar({ length: 255 }).default(sql`NULL`),
//     country: varchar({ length: 255 }).default(sql`NULL`),
//     city: varchar({ length: 255 }).default(sql`NULL`),
//     streetAddress: varchar({ length: 255 }).default(sql`NULL`),
// }, (table) => {
//     return {
//         userIdNameUnique: uniqueIndex("profiles_user_id_name_unique").using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.name.asc().nullsLast().op("int8_ops")),
//         profilesUserIdForeign: foreignKey({
//             columns: [table.userId],
//             foreignColumns: [users.id],
//             name: "profiles_user_id_foreign"
//         }),
//     }
// });

// export const spokenLanguages = pgTable("spoken_languages", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "spoken_languages_id_seq", startWith: 1000 }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// });

// export const spokenLanguageTranslations = pgTable("spoken_language_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "spoken_language_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         spokenLanguageIdLocaleUnique: uniqueIndex("spoken_language_translations_spoken_language_id_locale_unique").using("btree", table.spokenLanguageId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         spokenLanguageTranslationsSpokenLanguageIdForeign: foreignKey({
//             columns: [table.spokenLanguageId],
//             foreignColumns: [spokenLanguages.id],
//             name: "spoken_language_translations_spoken_language_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const countries = pgTable("countries", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "countries_id_seq", startWith: 1000 }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// });

// export const countryTranslations = pgTable("country_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "country_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     countryId: bigint("country_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         countryIdLocaleUnique: uniqueIndex("country_translations_country_id_locale_unique").using("btree", table.countryId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         countryTranslationsCountryIdForeign: foreignKey({
//             columns: [table.countryId],
//             foreignColumns: [countries.id],
//             name: "country_translations_country_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const states = pgTable("states", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "states_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     countryId: bigint("country_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         statesCountryIdForeign: foreignKey({
//             columns: [table.countryId],
//             foreignColumns: [countries.id],
//             name: "states_country_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const stateTranslations = pgTable("state_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "state_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     stateId: bigint("state_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         stateIdLocaleUnique: uniqueIndex("state_translations_state_id_locale_unique").using("btree", table.stateId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         stateTranslationsStateIdForeign: foreignKey({
//             columns: [table.stateId],
//             foreignColumns: [states.id],
//             name: "state_translations_state_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const cities = pgTable("cities", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "cities_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     stateId: bigint("state_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         citiesStateIdForeign: foreignKey({
//             columns: [table.stateId],
//             foreignColumns: [states.id],
//             name: "cities_state_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const cityTranslations = pgTable("city_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "city_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     cityId: bigint("city_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         cityIdLocaleUnique: uniqueIndex("city_translations_city_id_locale_unique").using("btree", table.cityId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         cityTranslationsCityIdForeign: foreignKey({
//             columns: [table.cityId],
//             foreignColumns: [cities.id],
//             name: "city_translations_city_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const addresses = pgTable("addresses", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "addresses_id_seq", startWith: 1000 }),
//     streetAddress: varchar("street_address", { length: 255 }).notNull(),
//     postalCode: varchar("postal_code", { length: 255 }).default(sql`NULL`),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     cityId: bigint("city_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     userId: bigint("user_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         userIdUnique: uniqueIndex("addresses_user_id_unique").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
//         addressesCityIdForeign: foreignKey({
//             columns: [table.cityId],
//             foreignColumns: [cities.id],
//             name: "addresses_city_id_foreign"
//         }),
//         addressesUserIdForeign: foreignKey({
//             columns: [table.userId],
//             foreignColumns: [users.id],
//             name: "addresses_user_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const facilities = pgTable("facilities", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "facilities_id_seq", startWith: 1000 }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// });

// export const facilityTranslations = pgTable("facility_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "facility_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     facilityId: bigint("facility_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         facilityIdLocaleUnique: uniqueIndex("facility_translations_facility_id_locale_unique").using("btree", table.facilityId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         facilityTranslationsFacilityIdForeign: foreignKey({
//             columns: [table.facilityId],
//             foreignColumns: [facilities.id],
//             name: "facility_translations_facility_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const sports = pgTable("sports", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sports_id_seq", startWith: 1000 }),
//     slug: varchar({ length: 255 }).default(sql`NULL`),
//     image: varchar({ length: 255 }).default(sql`NULL`),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         slugUnique: uniqueIndex("sports_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(slug IS NOT NULL)`),
//     }
// });

// export const sportTranslations = pgTable("sport_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sport_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     sportId: bigint("sport_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         sportIdLocaleUnique: uniqueIndex("sport_translations_sport_id_locale_unique").using("btree", table.sportId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         sportTranslationsSportIdForeign: foreignKey({
//             columns: [table.sportId],
//             foreignColumns: [sports.id],
//             name: "sport_translations_sport_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const academics = pgTable("academics", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academics_id_seq", startWith: 1000 }),
//     slug: varchar({ length: 255 }).notNull(),
//     entryFees: doublePrecision("entry_fees").default(0).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     userId: bigint("user_id", { mode: "number" }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     image: varchar({ length: 255 }).default(sql`NULL`),
//     policy: text(),
//     extra: varchar({ length: 255 }).default(sql`NULL`),
//     status: status().default('pending'),
//     onboarded: boolean("onboarded").default(false).notNull(),
// }, (table) => {
//     return {
//         slugUnique: uniqueIndex("academics_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
//         academicsUserIdForeign: foreignKey({
//             columns: [table.userId],
//             foreignColumns: [users.id],
//             name: "academics_user_id_foreign"
//         }),
//     }
// });

// export const academicTranslations = pgTable("academic_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academic_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).default(sql`NULL`),
//     description: text(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         academicIdLocaleUnique: uniqueIndex("academic_translations_academic_id_locale_unique").using("btree", table.academicId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         academicTranslationsAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "academic_translations_academic_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const branches = pgTable("branches", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branches_id_seq", startWith: 1000 }),
//     slug: varchar({ length: 255 }).notNull(),
//     latitude: varchar({ length: 255 }).default(sql`NULL`),
//     longitude: varchar({ length: 255 }).default(sql`NULL`),
//     isDefault: boolean("is_default").default(false).notNull(),
//     rate: doublePrecision(),
//     reviews: integer(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     url: varchar({ length: 255 }).default(sql`NULL`),
//     placeId: varchar("place_id", { length: 255 }).default(sql`NULL`),
//     nameInGoogleMap: varchar("name_in_google_map", { length: 255 }).default(sql`NULL`),
// }, (table) => {
//     return {
//         slugUnique: uniqueIndex("branches_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
//         branchesAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "branches_academic_id_foreign"
//         }),
//     }
// });

// export const branchTranslations = pgTable("branch_translations", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branch_translations_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     branchId: bigint("branch_id", { mode: "number" }).notNull(),
//     locale: varchar({ length: 255 }).notNull(),
//     name: varchar({ length: 255 }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         branchIdLocaleUnique: uniqueIndex("branch_translations_branch_id_locale_unique").using("btree", table.branchId.asc().nullsLast().op("int8_ops"), table.locale.asc().nullsLast().op("int8_ops")),
//         branchTranslationsBranchIdForeign: foreignKey({
//             columns: [table.branchId],
//             foreignColumns: [branches.id],
//             name: "branch_translations_branch_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const branchFacility = pgTable("branch_facility", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branch_facility_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     branchId: bigint("branch_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     facilityId: bigint("facility_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         branchFacilityBranchIdForeign: foreignKey({
//             columns: [table.branchId],
//             foreignColumns: [branches.id],
//             name: "branch_facility_branch_id_foreign"
//         }).onDelete("cascade"),
//         branchFacilityFacilityIdForeign: foreignKey({
//             columns: [table.facilityId],
//             foreignColumns: [facilities.id],
//             name: "branch_facility_facility_id_foreign"
//         }),
//     }
// });

// export const branchSport = pgTable("branch_sport", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "branch_sport_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     branchId: bigint("branch_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     sportId: bigint("sport_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         branchSportBranchIdForeign: foreignKey({
//             columns: [table.branchId],
//             foreignColumns: [branches.id],
//             name: "branch_sport_branch_id_foreign"
//         }).onDelete("cascade"),
//         branchSportSportIdForeign: foreignKey({
//             columns: [table.sportId],
//             foreignColumns: [sports.id],
//             name: "branch_sport_sport_id_foreign"
//         }),
//     }
// });

// export const programs = pgTable("programs", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "programs_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }),
//     type: varchar({ length: 255 }),
//     numberOfSeats: integer("number_of_seats"),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     branchId: bigint("branch_id", { mode: "number" }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     sportId: bigint("sport_id", { mode: "number" }),
//     gender: varchar({ length: 255 }).default(sql`NULL`),
//     name: varchar({ length: 255 }).default(sql`NULL`),
//     description: varchar({ length: 255 }).default(sql`NULL`),
//     startDateOfBirth: date("start_date_of_birth"),
//     endDateOfBirth: date("end_date_of_birth"),
//     color: varchar({ length: 255 }).default(sql`NULL`),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         programsAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "programs_academic_id_foreign"
//         }).onDelete("cascade"),
//         programsBranchIdForeign: foreignKey({
//             columns: [table.branchId],
//             foreignColumns: [branches.id],
//             name: "programs_branch_id_foreign"
//         }).onDelete("cascade"),
//         programsSportIdForeign: foreignKey({
//             columns: [table.sportId],
//             foreignColumns: [sports.id],
//             name: "programs_sport_id_foreign"
//         }),
//         programsTypeCheck: check("programs_type_check", sql`(type)::text = ANY ((ARRAY['TEAM'::character varying, 'PRIVATE'::character varying])::text[])`),
//     }
// });

// export const academicSport = pgTable("academic_sport", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academic_sport_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     sportId: bigint("sport_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         academicSportAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "academic_sport_academic_id_foreign"
//         }),
//         academicSportSportIdForeign: foreignKey({
//             columns: [table.sportId],
//             foreignColumns: [sports.id],
//             name: "academic_sport_sport_id_foreign"
//         }),
//     }
// });

// export const academicAthletic = pgTable("academic_athletic", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "academic_athletic_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     userId: bigint("user_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     profileId: bigint("profile_id", { mode: "number" }),
//     certificate: varchar({ length: 255 }).default(sql`NULL`),
//     type: athleticType().default('primary'),
//     firstGuardianName: varchar("first_guardian_name", { length: 255 }).default(sql`NULL`),
//     firstGuardianRelationship: varchar("first_guardian_relationship", { length: 255 }).default(sql`NULL`),
//     secondGuardianName: varchar("second_guardian_name", { length: 255 }).default(sql`NULL`),
//     secondGuardianRelationship: varchar("second_guardian_relationship", { length: 255 }).default(sql`NULL`),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         academicAthleticAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "academic_athletic_academic_id_foreign"
//         }),
//         academicAthleticUserIdForeign: foreignKey({
//             columns: [table.userId],
//             foreignColumns: [users.id],
//             name: "academic_athletic_user_id_foreign"
//         }),
//     }
// });

// export const coaches = pgTable("coaches", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coaches_id_seq", startWith: 1000 }),
//     name: varchar({ length: 255 }).notNull(),
//     title: varchar({ length: 255 }).default(sql`NULL`),
//     image: varchar({ length: 255 }).default(sql`NULL`),
//     bio: text(),
//     gender: varchar({ length: 255 }).default(sql`NULL`),
//     privateSessionPercentage: varchar("private_session_percentage", { length: 255 }).default(sql`NULL`),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     dateOfBirth: date("date_of_birth"),
// }, (table) => {
//     return {
//         coachesAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "coaches_academic_id_foreign"
//         }),
//     }
// });

// export const packages = pgTable("packages", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "packages_id_seq", startWith: 1000 }),
//     name: varchar({ length: 255 }).default('Assessment Package').notNull(),
//     price: doublePrecision().notNull(),
//     startDate: date("start_date").notNull(),
//     endDate: date("end_date").notNull(),
//     sessionPerWeek: integer("session_per_week").default(0).notNull(),
//     sessionDuration: integer("session_duration"),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     programId: bigint("program_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     memo: text(),
//     entryFees: doublePrecision("entry_fees").default(0).notNull(),
//     entryFeesExplanation: text("entry_fees_explanation"),
//     entryFeesAppliedUntil: text("entry_fees_applied_until").array(),
//     entryFeesStartDate: date("entry_fees_start_date"),
//     entryFeesEndDate: date("entry_fees_end_date"),
// }, (table) => {
//     return {
//         packagesProgramIdForeign: foreignKey({
//             columns: [table.programId],
//             foreignColumns: [programs.id],
//             name: "packages_program_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const notifications = pgTable("notifications", {
//     id: uuid().primaryKey().notNull(),
//     type: varchar({ length: 255 }).notNull(),
//     notifiableType: varchar("notifiable_type", { length: 255 }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     notifiableId: bigint("notifiable_id", { mode: "number" }).notNull(),
//     data: text().notNull(),
//     readAt: timestamp("read_at", { mode: 'string' }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         notifiableTypeNotifiableIdIdx: index().using("btree", table.notifiableType.asc().nullsLast().op("int8_ops"), table.notifiableId.asc().nullsLast().op("int8_ops")),
//     }
// });

// export const schedules = pgTable("schedules", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "schedules_id_seq", startWith: 1000 }),
//     day: varchar({ length: 255 }).notNull(),
//     from: time().notNull(),
//     to: time().notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     packageId: bigint("package_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     memo: text(),
// }, (table) => {
//     return {
//         schedulesPackageIdForeign: foreignKey({
//             columns: [table.packageId],
//             foreignColumns: [packages.id],
//             name: "schedules_package_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const bookings = pgTable("bookings", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "bookings_id_seq", startWith: 1000 }),
//     status: varchar({ length: 255 }).default('pending').notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     coachId: bigint("coach_id", { mode: "number" }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     profileId: bigint("profile_id", { mode: "number" }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     packageId: bigint("package_id", { mode: "number" }).notNull(),
//     price: doublePrecision().default(0).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
//     academyPolicy: boolean("academy_policy").default(false).notNull(),
//     roapPolicy: boolean("roap_policy").default(false).notNull(),
//     packagePrice: doublePrecision("package_price").default(0).notNull(),
// }, (table) => {
//     return {
//         bookingsCoachIdForeign: foreignKey({
//             columns: [table.coachId],
//             foreignColumns: [coaches.id],
//             name: "bookings_coach_id_foreign"
//         }).onDelete("cascade"),
//         bookingsPackageIdForeign: foreignKey({
//             columns: [table.packageId],
//             foreignColumns: [packages.id],
//             name: "bookings_package_id_foreign"
//         }).onDelete("cascade"),
//         bookingsProfileIdForeign: foreignKey({
//             columns: [table.profileId],
//             foreignColumns: [profiles.id],
//             name: "bookings_profile_id_foreign"
//         }).onDelete("cascade"),
//         bookingsStatusCheck: check("bookings_status_check", sql`(status)::text = ANY ((ARRAY['success'::character varying, 'rejected'::character varying, 'pending'::character varying])::text[])`),
//     }
// });

// export const bookingSessions = pgTable("booking_sessions", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "booking_sessions_id_seq", startWith: 1000 }),
//     date: date().notNull(),
//     from: varchar({ length: 255 }).notNull(),
//     to: varchar({ length: 255 }).notNull(),
//     status: varchar({ length: 255 }).default('pending').notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     bookingId: bigint("booking_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         bookingSessionsBookingIdForeign: foreignKey({
//             columns: [table.bookingId],
//             foreignColumns: [bookings.id],
//             name: "booking_sessions_booking_id_foreign"
//         }).onDelete("cascade"),
//         bookingSessionsStatusCheck: check("booking_sessions_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'upcoming'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])`),
//     }
// });

// export const coachPackage = pgTable("coach_package", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_package_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     coachId: bigint("coach_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     packageId: bigint("package_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         coachPackageCoachIdForeign: foreignKey({
//             columns: [table.coachId],
//             foreignColumns: [coaches.id],
//             name: "coach_package_coach_id_foreign"
//         }).onDelete("cascade"),
//         coachPackagePackageIdForeign: foreignKey({
//             columns: [table.packageId],
//             foreignColumns: [packages.id],
//             name: "coach_package_package_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const coachProgram = pgTable("coach_program", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_program_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     coachId: bigint("coach_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     programId: bigint("program_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         coachProgramCoachIdForeign: foreignKey({
//             columns: [table.coachId],
//             foreignColumns: [coaches.id],
//             name: "coach_program_coach_id_foreign"
//         }),
//         coachProgramProgramIdForeign: foreignKey({
//             columns: [table.programId],
//             foreignColumns: [programs.id],
//             name: "coach_program_program_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const coachSpokenLanguage = pgTable("coach_spoken_language", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_spoken_language_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     spokenLanguageId: bigint("spoken_language_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     coachId: bigint("coach_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         coachSpokenLanguageCoachIdForeign: foreignKey({
//             columns: [table.coachId],
//             foreignColumns: [coaches.id],
//             name: "coach_spoken_language_coach_id_foreign"
//         }).onDelete("cascade"),
//         coachSpokenLanguageSpokenLanguageIdForeign: foreignKey({
//             columns: [table.spokenLanguageId],
//             foreignColumns: [spokenLanguages.id],
//             name: "coach_spoken_language_spoken_language_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const coachSport = pgTable("coach_sport", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "coach_sport_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     coachId: bigint("coach_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     sportId: bigint("sport_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         coachSportCoachIdForeign: foreignKey({
//             columns: [table.coachId],
//             foreignColumns: [coaches.id],
//             name: "coach_sport_coach_id_foreign"
//         }).onDelete("cascade"),
//         coachSportSportIdForeign: foreignKey({
//             columns: [table.sportId],
//             foreignColumns: [sports.id],
//             name: "coach_sport_sport_id_foreign"
//         }),
//     }
// });

// export const subscriptions = pgTable("subscriptions", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "subscriptions_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     userId: bigint("user_id", { mode: "number" }).notNull(),
//     type: varchar({ length: 255 }).notNull(),
//     stripeId: varchar("stripe_id", { length: 255 }).notNull(),
//     stripeStatus: varchar("stripe_status", { length: 255 }).notNull(),
//     stripePrice: varchar("stripe_price", { length: 255 }).default(sql`NULL`),
//     quantity: integer(),
//     trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
//     endsAt: timestamp("ends_at", { mode: 'string' }),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         stripeIdUnique: uniqueIndex("subscriptions_stripe_id_unique").using("btree", table.stripeId.asc().nullsLast().op("text_ops")),
//         userIdStripeStatusIdx: index().using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.stripeStatus.asc().nullsLast().op("int8_ops")),
//         subscriptionsUserIdForeign: foreignKey({
//             columns: [table.userId],
//             foreignColumns: [users.id],
//             name: "subscriptions_user_id_foreign"
//         }),
//     }
// });

// export const subscriptionItems = pgTable("subscription_items", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "subscription_items_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     subscriptionId: bigint("subscription_id", { mode: "number" }).notNull(),
//     stripeId: varchar("stripe_id", { length: 255 }).notNull(),
//     stripeProduct: varchar("stripe_product", { length: 255 }).notNull(),
//     stripePrice: varchar("stripe_price", { length: 255 }).notNull(),
//     quantity: integer(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         stripeIdUnique: uniqueIndex("subscription_items_stripe_id_unique").using("btree", table.stripeId.asc().nullsLast().op("text_ops")),
//         subscriptionIdStripePriceIdx: index().using("btree", table.subscriptionId.asc().nullsLast().op("int8_ops"), table.stripePrice.asc().nullsLast().op("int8_ops")),
//         subscriptionItemsSubscriptionIdForeign: foreignKey({
//             columns: [table.subscriptionId],
//             foreignColumns: [subscriptions.id],
//             name: "subscription_items_subscription_id_foreign"
//         }),
//     }
// });

// export const wishlist = pgTable("wishlist", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "wishlist_id_seq", startWith: 1000 }),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     academicId: bigint("academic_id", { mode: "number" }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     userId: bigint("user_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         userIdAcademicIdUnique: uniqueIndex("wishlist_user_id_academic_id_unique").using("btree", table.userId.asc().nullsLast().op("int8_ops"), table.academicId.asc().nullsLast().op("int8_ops")),
//         wishlistAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "wishlist_academic_id_foreign"
//         }).onDelete("cascade"),
//         wishlistUserIdForeign: foreignKey({
//             columns: [table.userId],
//             foreignColumns: [users.id],
//             name: "wishlist_user_id_foreign"
//         }).onDelete("cascade"),
//     }
// });

// export const payments = pgTable("payments", {
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "payments_id_seq", startWith: 1000 }),
//     resourceableType: varchar("resourceable_type", { length: 255 }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     resourceableId: bigint("resourceable_id", { mode: "number" }).notNull(),
//     price: doublePrecision().notNull(),
//     paymentMethod: varchar("payment_method", { length: 255 }).default(sql`NULL`),
//     merchantReferenceNumber: varchar("merchant_reference_number", { length: 255 }).default(sql`NULL`),
//     status: varchar({ length: 255 }).default('pending').notNull(),
//     referableType: varchar("referable_type", { length: 255 }).notNull(),
//     // You can use { mode: "bigint" } if numbers are exceeding js number limitations
//     referableId: bigint("referable_id", { mode: "number" }).notNull(),
//     referenceNumber: uuid("reference_number").notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         referableTypeReferableIdIdx: index().using("btree", table.referableType.asc().nullsLast().op("int8_ops"), table.referableId.asc().nullsLast().op("text_ops")),
//         resourceableTypeResourceableIdIdx: index().using("btree", table.resourceableType.asc().nullsLast().op("text_ops"), table.resourceableId.asc().nullsLast().op("int8_ops")),
//     }
// });

// export const promoCodes = pgTable("promo_codes", {
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "promo_codes_id_seq", startWith: 1000 }),
//     code: varchar({ length: 50 }).notNull(),
//     discountType: discountType("discount_type").notNull(),
//     discountValue: doublePrecision().notNull(),
//     startDate: timestamp("start_date", { mode: 'string' }).notNull(),
//     endDate: timestamp("end_date", { mode: 'string' }).notNull(),
//     academicId: bigint("academic_id", { mode: "number" }).notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         codeAcademicUnique: unique("promo_codes_code_academic_unique").on(table.code, table.academicId),
//         promoCodesAcademicIdForeign: foreignKey({
//             columns: [table.academicId],
//             foreignColumns: [academics.id],
//             name: "promo_codes_academic_id_foreign"
//         }).onDelete("cascade"),
//     }
// })


// export const media = pgTable("media", {
//     id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "media_id_seq", startWith: 1000 }),
//     referableType: varchar("referable_type", { length: 255 }).notNull(),
//     referableId: bigint("referable_id", { mode: "number" }).notNull(),
//     url: varchar({ length: 255 }).notNull(),
//     type: varchar({ length: 255 }).default('0').notNull(),
//     createdAt: timestamp("created_at", { mode: 'string' }),
//     updatedAt: timestamp("updated_at", { mode: 'string' }),
// }, (table) => {
//     return {
//         referableTypeReferableIdIdx: index("media_referable_type_referable_id_index").on(table.referableType, table.referableId),
//     }
// });

// export const mediaRelations = relations(media, ({ one }) => ({
//     academic: one(academics, {
//         fields: [media.referableId],
//         references: [academics.id],
//         relationName: "academic_media"
//     }),
// }));

// export const promoCodesRelations = relations(promoCodes, ({ one, many }) => ({
//     academic: one(academics, {
//         fields: [promoCodes.academicId],
//         references: [academics.id],
//     }),
// }))

// export const profilesRelations = relations(profiles, ({ one, many }) => ({
//     user: one(users, {
//         fields: [profiles.userId],
//         references: [users.id]
//     }),
//     bookings: many(bookings),
// }));

// export const usersRelations = relations(users, ({ many }) => ({
//     profiles: many(profiles),
//     addresses: many(addresses),
//     academics: many(academics),
//     academicAthletics: many(academicAthletic),
//     subscriptions: many(subscriptions),
//     wishlists: many(wishlist),
// }));

// export const spokenLanguageTranslationsRelations = relations(spokenLanguageTranslations, ({ one }) => ({
//     spokenLanguage: one(spokenLanguages, {
//         fields: [spokenLanguageTranslations.spokenLanguageId],
//         references: [spokenLanguages.id]
//     }),
// }));

// export const spokenLanguagesRelations = relations(spokenLanguages, ({ many }) => ({
//     spokenLanguageTranslations: many(spokenLanguageTranslations),
//     coachSpokenLanguages: many(coachSpokenLanguage),
// }));

// export const countryTranslationsRelations = relations(countryTranslations, ({ one }) => ({
//     country: one(countries, {
//         fields: [countryTranslations.countryId],
//         references: [countries.id]
//     }),
// }));

// export const countriesRelations = relations(countries, ({ many }) => ({
//     countryTranslations: many(countryTranslations),
//     states: many(states),
// }));

// export const statesRelations = relations(states, ({ one, many }) => ({
//     country: one(countries, {
//         fields: [states.countryId],
//         references: [countries.id]
//     }),
//     stateTranslations: many(stateTranslations),
//     cities: many(cities),
// }));

// export const stateTranslationsRelations = relations(stateTranslations, ({ one }) => ({
//     state: one(states, {
//         fields: [stateTranslations.stateId],
//         references: [states.id]
//     }),
// }));

// export const citiesRelations = relations(cities, ({ one, many }) => ({
//     state: one(states, {
//         fields: [cities.stateId],
//         references: [states.id]
//     }),
//     cityTranslations: many(cityTranslations),
//     addresses: many(addresses),
// }));

// export const cityTranslationsRelations = relations(cityTranslations, ({ one }) => ({
//     city: one(cities, {
//         fields: [cityTranslations.cityId],
//         references: [cities.id]
//     }),
// }));

// export const addressesRelations = relations(addresses, ({ one }) => ({
//     city: one(cities, {
//         fields: [addresses.cityId],
//         references: [cities.id]
//     }),
//     user: one(users, {
//         fields: [addresses.userId],
//         references: [users.id]
//     }),
// }));

// export const facilityTranslationsRelations = relations(facilityTranslations, ({ one }) => ({
//     facility: one(facilities, {
//         fields: [facilityTranslations.facilityId],
//         references: [facilities.id]
//     }),
// }));

// export const facilitiesRelations = relations(facilities, ({ many }) => ({
//     facilityTranslations: many(facilityTranslations),
//     branchFacilities: many(branchFacility),
// }));

// export const sportTranslationsRelations = relations(sportTranslations, ({ one }) => ({
//     sport: one(sports, {
//         fields: [sportTranslations.sportId],
//         references: [sports.id]
//     }),
// }));

// export const sportsRelations = relations(sports, ({ many }) => ({
//     sportTranslations: many(sportTranslations),
//     branchSports: many(branchSport),
//     programs: many(programs),
//     academicSports: many(academicSport),
//     coachSports: many(coachSport),
// }));

// export const academicsRelations = relations(academics, ({ one, many }) => ({
//     user: one(users, {
//         fields: [academics.userId],
//         references: [users.id]
//     }),
//     academicTranslations: many(academicTranslations),
//     branches: many(branches),
//     programs: many(programs),
//     academicSports: many(academicSport),
//     academicAthletics: many(academicAthletic),
//     coaches: many(coaches),
//     wishlists: many(wishlist),
//     promoCodes: many(promoCodes),
//     media: many(media, {
//         relationName: "academic_media"
//     }),
// }));

// export const academicTranslationsRelations = relations(academicTranslations, ({ one }) => ({
//     academic: one(academics, {
//         fields: [academicTranslations.academicId],
//         references: [academics.id]
//     }),
// }));

// export const branchesRelations = relations(branches, ({ one, many }) => ({
//     academic: one(academics, {
//         fields: [branches.academicId],
//         references: [academics.id]
//     }),
//     branchTranslations: many(branchTranslations),
//     branchFacilities: many(branchFacility),
//     branchSports: many(branchSport),
//     programs: many(programs),
// }));

// export const branchTranslationsRelations = relations(branchTranslations, ({ one }) => ({
//     branch: one(branches, {
//         fields: [branchTranslations.branchId],
//         references: [branches.id]
//     }),
// }));

// export const branchFacilityRelations = relations(branchFacility, ({ one }) => ({
//     branch: one(branches, {
//         fields: [branchFacility.branchId],
//         references: [branches.id]
//     }),
//     facility: one(facilities, {
//         fields: [branchFacility.facilityId],
//         references: [facilities.id]
//     }),
// }));

// export const branchSportRelations = relations(branchSport, ({ one }) => ({
//     branch: one(branches, {
//         fields: [branchSport.branchId],
//         references: [branches.id]
//     }),
//     sport: one(sports, {
//         fields: [branchSport.sportId],
//         references: [sports.id]
//     }),
// }));

// export const programsRelations = relations(programs, ({ one, many }) => ({
//     academic: one(academics, {
//         fields: [programs.academicId],
//         references: [academics.id]
//     }),
//     branch: one(branches, {
//         fields: [programs.branchId],
//         references: [branches.id]
//     }),
//     sport: one(sports, {
//         fields: [programs.sportId],
//         references: [sports.id]
//     }),
//     packages: many(packages),
//     coachPrograms: many(coachProgram),
// }));

// export const academicSportRelations = relations(academicSport, ({ one }) => ({
//     academic: one(academics, {
//         fields: [academicSport.academicId],
//         references: [academics.id]
//     }),
//     sport: one(sports, {
//         fields: [academicSport.sportId],
//         references: [sports.id]
//     }),
// }));

// export const academicAthleticRelations = relations(academicAthletic, ({ one }) => ({
//     academic: one(academics, {
//         fields: [academicAthletic.academicId],
//         references: [academics.id]
//     }),
//     user: one(users, {
//         fields: [academicAthletic.userId],
//         references: [users.id]
//     }),
// }));

// export const coachesRelations = relations(coaches, ({ one, many }) => ({
//     academic: one(academics, {
//         fields: [coaches.academicId],
//         references: [academics.id]
//     }),
//     bookings: many(bookings),
//     coachPackages: many(coachPackage),
//     coachPrograms: many(coachProgram),
//     coachSpokenLanguages: many(coachSpokenLanguage),
//     coachSports: many(coachSport),
// }));

// export const packagesRelations = relations(packages, ({ one, many }) => ({
//     program: one(programs, {
//         fields: [packages.programId],
//         references: [programs.id]
//     }),
//     schedules: many(schedules),
//     bookings: many(bookings),
//     coachPackages: many(coachPackage),
// }));

// export const schedulesRelations = relations(schedules, ({ one }) => ({
//     package: one(packages, {
//         fields: [schedules.packageId],
//         references: [packages.id]
//     }),
// }));

// export const bookingsRelations = relations(bookings, ({ one, many }) => ({
//     coach: one(coaches, {
//         fields: [bookings.coachId],
//         references: [coaches.id]
//     }),
//     package: one(packages, {
//         fields: [bookings.packageId],
//         references: [packages.id]
//     }),
//     profile: one(profiles, {
//         fields: [bookings.profileId],
//         references: [profiles.id]
//     }),
//     bookingSessions: many(bookingSessions),
// }));

// export const bookingSessionsRelations = relations(bookingSessions, ({ one }) => ({
//     booking: one(bookings, {
//         fields: [bookingSessions.bookingId],
//         references: [bookings.id]
//     }),
// }));

// export const coachPackageRelations = relations(coachPackage, ({ one }) => ({
//     coach: one(coaches, {
//         fields: [coachPackage.coachId],
//         references: [coaches.id]
//     }),
//     package: one(packages, {
//         fields: [coachPackage.packageId],
//         references: [packages.id]
//     }),
// }));

// export const coachProgramRelations = relations(coachProgram, ({ one }) => ({
//     coach: one(coaches, {
//         fields: [coachProgram.coachId],
//         references: [coaches.id]
//     }),
//     program: one(programs, {
//         fields: [coachProgram.programId],
//         references: [programs.id]
//     }),
// }));

// export const coachSpokenLanguageRelations = relations(coachSpokenLanguage, ({ one }) => ({
//     coach: one(coaches, {
//         fields: [coachSpokenLanguage.coachId],
//         references: [coaches.id]
//     }),
//     spokenLanguage: one(spokenLanguages, {
//         fields: [coachSpokenLanguage.spokenLanguageId],
//         references: [spokenLanguages.id]
//     }),
// }));

// export const coachSportRelations = relations(coachSport, ({ one }) => ({
//     coach: one(coaches, {
//         fields: [coachSport.coachId],
//         references: [coaches.id]
//     }),
//     sport: one(sports, {
//         fields: [coachSport.sportId],
//         references: [sports.id]
//     }),
// }));

// export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
//     user: one(users, {
//         fields: [subscriptions.userId],
//         references: [users.id]
//     }),
//     subscriptionItems: many(subscriptionItems),
// }));

// export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
//     subscription: one(subscriptions, {
//         fields: [subscriptionItems.subscriptionId],
//         references: [subscriptions.id]
//     }),
// }));

// export const wishlistRelations = relations(wishlist, ({ one }) => ({
//     academic: one(academics, {
//         fields: [wishlist.academicId],
//         references: [academics.id]
//     }),
//     user: one(users, {
//         fields: [wishlist.userId],
//         references: [users.id]
//     }),
// })); ""