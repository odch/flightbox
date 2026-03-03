import allCategories from './aircraftCategoriesData';

const categoryNames = allCategories.map(category => category.name)

const isHelicopter = (aircraftCategory: string) => ['Hubschrauber', 'Eigenbauhubschrauber',].includes(aircraftCategory);

const flightTypeAircraftType = (aircraftCategory: string | null) => {
  if (!aircraftCategory) {
    return null
  }

  const category = allCategories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.flightTypeAircraftType
  }
}

const icon = (aircraftCategory: string | null) => {
  if (!aircraftCategory) {
    return null
  }

  const category = allCategories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.icon
  }
}

export const categories = categoryNames;
export { isHelicopter, flightTypeAircraftType, icon };
