import { relations } from "drizzle-orm/relations";
import { users, academics, academicAthletic, profiles, sports, academicSport, academicTranslations, account, cities, addresses, coaches, bookings, packages, bookingSessions, branches, branchFacility, facilities, branchSport, branchTranslations, states, cityTranslations, coachPackage, coachProgram, programs, coachSpokenLanguage, spokenLanguages, coachSport, countries, countryTranslations, facilityTranslations, permissions, modelHasPermissions, roles, modelHasRoles, otpVerifications, pages, pageTranslations, roleHasPermissions, schedules, session, spokenLanguageTranslations, sportTranslations, stateTranslations, wishlist } from "./schema";

export const academicsRelations = relations(academics, ({one, many}) => ({
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

export const usersRelations = relations(users, ({many}) => ({
	academics: many(academics),
	academicAthletics: many(academicAthletic),
	accounts: many(account),
	addresses: many(addresses),
	otpVerifications: many(otpVerifications),
	profiles: many(profiles),
	sessions: many(session),
	wishlists: many(wishlist),
}));

export const academicAthleticRelations = relations(academicAthletic, ({one}) => ({
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

export const profilesRelations = relations(profiles, ({one, many}) => ({
	academicAthletics: many(academicAthletic),
	bookings: many(bookings),
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id]
	}),
}));

export const sportsRelations = relations(sports, ({many}) => ({
	academicAthletics: many(academicAthletic),
	academicSports: many(academicSport),
	branchSports: many(branchSport),
	coachSports: many(coachSport),
	programs: many(programs),
	sportTranslations: many(sportTranslations),
}));

export const academicSportRelations = relations(academicSport, ({one}) => ({
	academic: one(academics, {
		fields: [academicSport.academicId],
		references: [academics.id]
	}),
	sport: one(sports, {
		fields: [academicSport.sportId],
		references: [sports.id]
	}),
}));

export const academicTranslationsRelations = relations(academicTranslations, ({one}) => ({
	academic: one(academics, {
		fields: [academicTranslations.academicId],
		references: [academics.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id]
	}),
}));

export const addressesRelations = relations(addresses, ({one}) => ({
	city: one(cities, {
		fields: [addresses.cityId],
		references: [cities.id]
	}),
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
}));

export const citiesRelations = relations(cities, ({one, many}) => ({
	addresses: many(addresses),
	state: one(states, {
		fields: [cities.stateId],
		references: [states.id]
	}),
	cityTranslations: many(cityTranslations),
}));

export const bookingsRelations = relations(bookings, ({one, many}) => ({
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

export const coachesRelations = relations(coaches, ({one, many}) => ({
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

export const packagesRelations = relations(packages, ({one, many}) => ({
	bookings: many(bookings),
	coachPackages: many(coachPackage),
	program: one(programs, {
		fields: [packages.programId],
		references: [programs.id]
	}),
	schedules: many(schedules),
}));

export const bookingSessionsRelations = relations(bookingSessions, ({one}) => ({
	booking: one(bookings, {
		fields: [bookingSessions.bookingId],
		references: [bookings.id]
	}),
}));

export const branchesRelations = relations(branches, ({one, many}) => ({
	academic: one(academics, {
		fields: [branches.academicId],
		references: [academics.id]
	}),
	branchFacilities: many(branchFacility),
	branchSports: many(branchSport),
	branchTranslations: many(branchTranslations),
	programs: many(programs),
}));

export const branchFacilityRelations = relations(branchFacility, ({one}) => ({
	branch: one(branches, {
		fields: [branchFacility.branchId],
		references: [branches.id]
	}),
	facility: one(facilities, {
		fields: [branchFacility.facilityId],
		references: [facilities.id]
	}),
}));

export const facilitiesRelations = relations(facilities, ({many}) => ({
	branchFacilities: many(branchFacility),
	facilityTranslations: many(facilityTranslations),
}));

export const branchSportRelations = relations(branchSport, ({one}) => ({
	branch: one(branches, {
		fields: [branchSport.branchId],
		references: [branches.id]
	}),
	sport: one(sports, {
		fields: [branchSport.sportId],
		references: [sports.id]
	}),
}));

export const branchTranslationsRelations = relations(branchTranslations, ({one}) => ({
	branch: one(branches, {
		fields: [branchTranslations.branchId],
		references: [branches.id]
	}),
}));

export const statesRelations = relations(states, ({one, many}) => ({
	cities: many(cities),
	country: one(countries, {
		fields: [states.countryId],
		references: [countries.id]
	}),
	stateTranslations: many(stateTranslations),
}));

export const cityTranslationsRelations = relations(cityTranslations, ({one}) => ({
	city: one(cities, {
		fields: [cityTranslations.cityId],
		references: [cities.id]
	}),
}));

export const coachPackageRelations = relations(coachPackage, ({one}) => ({
	coach: one(coaches, {
		fields: [coachPackage.coachId],
		references: [coaches.id]
	}),
	package: one(packages, {
		fields: [coachPackage.packageId],
		references: [packages.id]
	}),
}));

export const coachProgramRelations = relations(coachProgram, ({one}) => ({
	coach: one(coaches, {
		fields: [coachProgram.coachId],
		references: [coaches.id]
	}),
	program: one(programs, {
		fields: [coachProgram.programId],
		references: [programs.id]
	}),
}));

export const programsRelations = relations(programs, ({one, many}) => ({
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

export const coachSpokenLanguageRelations = relations(coachSpokenLanguage, ({one}) => ({
	coach: one(coaches, {
		fields: [coachSpokenLanguage.coachId],
		references: [coaches.id]
	}),
	spokenLanguage: one(spokenLanguages, {
		fields: [coachSpokenLanguage.spokenLanguageId],
		references: [spokenLanguages.id]
	}),
}));

export const spokenLanguagesRelations = relations(spokenLanguages, ({many}) => ({
	coachSpokenLanguages: many(coachSpokenLanguage),
	spokenLanguageTranslations: many(spokenLanguageTranslations),
}));

export const coachSportRelations = relations(coachSport, ({one}) => ({
	coach: one(coaches, {
		fields: [coachSport.coachId],
		references: [coaches.id]
	}),
	sport: one(sports, {
		fields: [coachSport.sportId],
		references: [sports.id]
	}),
}));

export const countryTranslationsRelations = relations(countryTranslations, ({one}) => ({
	country: one(countries, {
		fields: [countryTranslations.countryId],
		references: [countries.id]
	}),
}));

export const countriesRelations = relations(countries, ({many}) => ({
	countryTranslations: many(countryTranslations),
	states: many(states),
}));

export const facilityTranslationsRelations = relations(facilityTranslations, ({one}) => ({
	facility: one(facilities, {
		fields: [facilityTranslations.facilityId],
		references: [facilities.id]
	}),
}));

export const modelHasPermissionsRelations = relations(modelHasPermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [modelHasPermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	modelHasPermissions: many(modelHasPermissions),
	roleHasPermissions: many(roleHasPermissions),
}));

export const modelHasRolesRelations = relations(modelHasRoles, ({one}) => ({
	role: one(roles, {
		fields: [modelHasRoles.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	modelHasRoles: many(modelHasRoles),
	roleHasPermissions: many(roleHasPermissions),
}));

export const otpVerificationsRelations = relations(otpVerifications, ({one}) => ({
	user: one(users, {
		fields: [otpVerifications.userId],
		references: [users.id]
	}),
}));

export const pageTranslationsRelations = relations(pageTranslations, ({one}) => ({
	page: one(pages, {
		fields: [pageTranslations.pageId],
		references: [pages.id]
	}),
}));

export const pagesRelations = relations(pages, ({many}) => ({
	pageTranslations: many(pageTranslations),
}));

export const roleHasPermissionsRelations = relations(roleHasPermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [roleHasPermissions.permissionId],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [roleHasPermissions.roleId],
		references: [roles.id]
	}),
}));

export const schedulesRelations = relations(schedules, ({one}) => ({
	package: one(packages, {
		fields: [schedules.packageId],
		references: [packages.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(users, {
		fields: [session.userId],
		references: [users.id]
	}),
}));

export const spokenLanguageTranslationsRelations = relations(spokenLanguageTranslations, ({one}) => ({
	spokenLanguage: one(spokenLanguages, {
		fields: [spokenLanguageTranslations.spokenLanguageId],
		references: [spokenLanguages.id]
	}),
}));

export const sportTranslationsRelations = relations(sportTranslations, ({one}) => ({
	sport: one(sports, {
		fields: [sportTranslations.sportId],
		references: [sports.id]
	}),
}));

export const stateTranslationsRelations = relations(stateTranslations, ({one}) => ({
	state: one(states, {
		fields: [stateTranslations.stateId],
		references: [states.id]
	}),
}));

export const wishlistRelations = relations(wishlist, ({one}) => ({
	academic: one(academics, {
		fields: [wishlist.academicId],
		references: [academics.id]
	}),
	user: one(users, {
		fields: [wishlist.userId],
		references: [users.id]
	}),
}));