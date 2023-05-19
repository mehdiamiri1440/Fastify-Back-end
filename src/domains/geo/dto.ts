export function provinceDto(province: any) {
  return {
    id: province.id,
    name: province.name,
    code: province.code,
    formated_name: province.formated_name,
  };
}

export function postalDto(postal: any) {
  return {
    postal_code: postal.postal_code,
  };
}

export function cityDto(city: any) {
  return {
    id: city.id,
    name: city.name,
    code: city.code,
    formated_name: city.formated_name,
  };
}

export function streetDto(street: any) {
  return {
    id: street.id,
    name: street.name,
    code: street.code,
    formated_name: street.formated_name,
  };
}

export function numberDto(number: any) {
  return {
    id: number.id,
    number: number.number,
    code: number.code,
    postal_code: number.postal_code,
  };
}
