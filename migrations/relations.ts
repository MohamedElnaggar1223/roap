import { relations } from "drizzle-orm/relations";
import { users, profiles, academics, blocks, spokenLanguages, spokenLanguageTranslations, blockBranches, branches, countries, countryTranslations, states, stateTranslations, cities, cityTranslations, addresses, facilities, facilityTranslations, sports, sportTranslations, blockSports, academicTranslations, blockPackages, packages, branchTranslations, branchFacility, promoCodes, branchSport, academicSport, programs, coaches, blockCoaches, academicAthletic, schedules, bookings, bookingSessions, coachPackage, coachProgram, coachSpokenLanguage, coachSport, subscriptions, subscriptionItems, wishlist } from "./schema";

export const profilesRelations = relations(profiles, ({one, many}) => ({
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id]
	}),
	bookings: many(bookings),
}));

export const usersRelations = relations(users, ({many}) => ({
	profiles: many(profiles),
	addresses: many(addresses),
	academics: many(academics),
	academicAthletics: many(academicAthletic),
	subscriptions: many(subscriptions),
	wishlists: many(wishlist),
}));

export const blocksRelations = relations(blocks, ({one, many}) => ({
	academic: one(academics, {
		fields: [blocks.academicId],
		references: [academics.id]
	}),
	blockBranches: many(blockBranches),
	blockSports: many(blockSports),
	blockPackages: many(blockPackages),
	blockCoaches: many(blockCoaches),
}));

export const academicsRelations = relations(academics, ({one, many}) => ({
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

export const spokenLanguageTranslationsRelations = relations(spokenLanguageTranslations, ({one}) => ({
	spokenLanguage: one(spokenLanguages, {
		fields: [spokenLanguageTranslations.spokenLanguageId],
		references: [spokenLanguages.id]
	}),
}));

export const spokenLanguagesRelations = relations(spokenLanguages, ({many}) => ({
	spokenLanguageTranslations: many(spokenLanguageTranslations),
	coachSpokenLanguages: many(coachSpokenLanguage),
}));

export const blockBranchesRelations = relations(blockBranches, ({one}) => ({
	block: one(blocks, {
		fields: [blockBranches.blockId],
		references: [blocks.id]
	}),
	branch: one(branches, {
		fields: [blockBranches.branchId],
		references: [branches.id]
	}),
}));

export const branchesRelations = relations(branches, ({one, many}) => ({
	blockBranches: many(blockBranches),
	academic: one(academics, {
		fields: [branches.academicId],
		references: [academics.id]
	}),
	branchTranslations: many(branchTranslations),
	branchFacilities: many(branchFacility),
	branchSports: many(branchSport),
	programs: many(programs),
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

export const statesRelations = relations(states, ({one, many}) => ({
	country: one(countries, {
		fields: [states.countryId],
		references: [countries.id]
	}),
	stateTranslations: many(stateTranslations),
	cities: many(cities),
}));

export const stateTranslationsRelations = relations(stateTranslations, ({one}) => ({
	state: one(states, {
		fields: [stateTranslations.stateId],
		references: [states.id]
	}),
}));

export const citiesRelations = relations(cities, ({one, many}) => ({
	state: one(states, {
		fields: [cities.stateId],
		references: [states.id]
	}),
	cityTranslations: many(cityTranslations),
	addresses: many(addresses),
}));

export const cityTranslationsRelations = relations(cityTranslations, ({one}) => ({
	city: one(cities, {
		fields: [cityTranslations.cityId],
		references: [cities.id]
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

export const facilityTranslationsRelations = relations(facilityTranslations, ({one}) => ({
	facility: one(facilities, {
		fields: [facilityTranslations.facilityId],
		references: [facilities.id]
	}),
}));

export const facilitiesRelations = relations(facilities, ({many}) => ({
	facilityTranslations: many(facilityTranslations),
	branchFacilities: many(branchFacility),
}));

export const sportTranslationsRelations = relations(sportTranslations, ({one}) => ({
	sport: one(sports, {
		fields: [sportTranslations.sportId],
		references: [sports.id]
	}),
}));

export const sportsRelations = relations(sports, ({many}) => ({
	sportTranslations: many(sportTranslations),
	blockSports: many(blockSports),
	branchSports: many(branchSport),
	academicSports: many(academicSport),
	programs: many(programs),
	coachSports: many(coachSport),
}));

export const blockSportsRelations = relations(blockSports, ({one}) => ({
	block: one(blocks, {
		fields: [blockSports.blockId],
		references: [blocks.id]
	}),
	sport: one(sports, {
		fields: [blockSports.sportId],
		references: [sports.id]
	}),
}));

export const academicTranslationsRelations = relations(academicTranslations, ({one}) => ({
	academic: one(academics, {
		fields: [academicTranslations.academicId],
		references: [academics.id]
	}),
}));

export const blockPackagesRelations = relations(blockPackages, ({one}) => ({
	block: one(blocks, {
		fields: [blockPackages.blockId],
		references: [blocks.id]
	}),
	package: one(packages, {
		fields: [blockPackages.packageId],
		references: [packages.id]
	}),
}));

export const packagesRelations = relations(packages, ({one, many}) => ({
	blockPackages: many(blockPackages),
	program: one(programs, {
		fields: [packages.programId],
		references: [programs.id]
	}),
	schedules: many(schedules),
	bookings: many(bookings),
	coachPackages: many(coachPackage),
}));

export const branchTranslationsRelations = relations(branchTranslations, ({one}) => ({
	branch: one(branches, {
		fields: [branchTranslations.branchId],
		references: [branches.id]
	}),
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

export const promoCodesRelations = relations(promoCodes, ({one}) => ({
	academic: one(academics, {
		fields: [promoCodes.academicId],
		references: [academics.id]
	}),
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

export const programsRelations = relations(programs, ({one, many}) => ({
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
}));

export const coachesRelations = relations(coaches, ({one, many}) => ({
	academic: one(academics, {
		fields: [coaches.academicId],
		references: [academics.id]
	}),
	blockCoaches: many(blockCoaches),
	bookings: many(bookings),
	coachPackages: many(coachPackage),
	coachPrograms: many(coachProgram),
	coachSpokenLanguages: many(coachSpokenLanguage),
	coachSports: many(coachSport),
}));

export const blockCoachesRelations = relations(blockCoaches, ({one}) => ({
	block: one(blocks, {
		fields: [blockCoaches.blockId],
		references: [blocks.id]
	}),
	coach: one(coaches, {
		fields: [blockCoaches.coachId],
		references: [coaches.id]
	}),
}));

export const academicAthleticRelations = relations(academicAthletic, ({one}) => ({
	academic: one(academics, {
		fields: [academicAthletic.academicId],
		references: [academics.id]
	}),
	user: one(users, {
		fields: [academicAthletic.userId],
		references: [users.id]
	}),
}));

export const schedulesRelations = relations(schedules, ({one}) => ({
	package: one(packages, {
		fields: [schedules.packageId],
		references: [packages.id]
	}),
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

export const bookingSessionsRelations = relations(bookingSessions, ({one}) => ({
	booking: one(bookings, {
		fields: [bookingSessions.bookingId],
		references: [bookings.id]
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

export const subscriptionsRelations = relations(subscriptions, ({one, many}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
	subscriptionItems: many(subscriptionItems),
}));

export const subscriptionItemsRelations = relations(subscriptionItems, ({one}) => ({
	subscription: one(subscriptions, {
		fields: [subscriptionItems.subscriptionId],
		references: [subscriptions.id]
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