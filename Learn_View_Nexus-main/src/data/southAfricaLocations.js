export const southAfricaLocations = {
  "Eastern Cape": ["Gqeberha", "East London", "Mthatha", "Queenstown", "Grahamstown", "Uitenhage", "King Williams Town", "Butterworth", "Cradock", "Graaff Reinet", "Port Alfred", "Jeffreys Bay"],
  "Free State": ["Bloemfontein", "Welkom", "Bethlehem", "Kroonstad", "Sasolburg", "Parys", "Phuthaditjhaba", "Virginia", "Harrismith"],
  "Gauteng": ["Johannesburg", "Pretoria", "Soweto", "Midrand", "Centurion", "Sandton", "Randburg", "Roodepoort", "Benoni", "Boksburg", "Germiston", "Kempton Park", "Alberton", "Vereeniging", "Vanderbijlpark", "Krugersdorp", "Springs", "Brakpan", "Tembisa", "Mamelodi"],
  "KwaZulu Natal": ["Durban", "Pietermaritzburg", "Newcastle", "Richards Bay", "Ladysmith", "Pinetown", "Empangeni", "Port Shepstone", "Stanger", "Umlazi", "KwaMashu", "Margate", "Vryheid"],
  "Limpopo": ["Polokwane", "Tzaneen", "Thohoyandou", "Makhado", "Musina", "Mokopane", "Bela Bela", "Lephalale", "Modimolle", "Giyani", "Phalaborwa", "Groblersdal", "Jane Furse", "Lebowakgomo", "Mankweng"],
  "Mpumalanga": ["Mbombela", "Witbank", "Middelburg", "Secunda", "Ermelo", "Standerton", "Barberton", "Hazyview", "White River", "Komatipoort", "Bethal", "Delmas", "Lydenburg"],
  "Northern Cape": ["Kimberley", "Upington", "Kuruman", "Springbok", "De Aar", "Colesberg", "Postmasburg", "Prieska", "Kathu"],
  "North West": ["Rustenburg", "Mahikeng", "Klerksdorp", "Potchefstroom", "Brits", "Lichtenburg", "Zeerust", "Vryburg", "Mogwase"],
  "Western Cape": ["Cape Town", "Stellenbosch", "Paarl", "Worcester", "George", "Mossel Bay", "Knysna", "Hermanus", "Somerset West", "Bellville", "Mitchells Plain", "Khayelitsha", "Oudtshoorn", "Malmesbury"]
};

export const provinces = Object.keys(southAfricaLocations);

export function citiesForProvince(province) {
  return southAfricaLocations[province] || [];
}
