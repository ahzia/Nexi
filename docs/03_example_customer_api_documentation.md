CapCorn Company Software GmbH
Flugplatzstraße 52
5700 Zell am See
Tel. +43 (0) 6542 21021
support@capcorn.at
CapCorn interface for room search
Room searches are conducted via HTTP POST requests to the following endpoint:
https://mainframe.capcorn.net/RestService/RoomAvailability?user=[username]&password=[Pass
wort]&system=[system]
For the tourism technology festival hackathon, the following credentials can be used:
System: ttf-hackathon
User: ttf
Password: Uv9-k_gYbmcsTHyU
Hotel-Id 9100
Important: The HTTP header should be set to "Content-Type: application/xml".
The room search can go up to 10 rooms, each of them with a maximum of 15 people. Maximum 8
of these 15 people can be children, including their ages.
Room search request
An example of a room search from December 17, 2025 to December 20, 2025 for a 3-bed room (2
adults + child aged 3 years) and a double room.
<room_availability>
<language>0</language>
<members>
<member hotel_id="9100"/>
</members>
<arrival>2025-12-17</arrival>
<departure>2025-12-20</departure>
<rooms>
<room adults="2">
<child age="3"/>
</room>
<room adults="2" />
</rooms>
</room_availability>
The parameters and elements of a request in detail:
<room_availability> Main node containing all information
<language> 0 = German, 1 = English
<members> Container for 1…n “member” nodes
<member> Passing the CapCorn Hotel ID via hotel_id to determine which
establishment should be searched
hotel_id <arrival> <departure> <rooms> adults <child> age Unique ID of the business in the CapCorn system
Date of arrival in the format YYYY-MM-DD
Departure date in the format YYYY-MM-DD
Container for details of the desired room occupancy
<room> 1…10 elements possible
indicates how many adults the room should accommodate
0…8 knots for age indications of children
Attribute indicates the child's age in years (integer value between 1 and 17)
Seite 1 / 6
CapCorn Company Software GmbH
Flugplatzstraße 52
5700 Zell am See
Tel. +43 (0) 6542 21021
support@capcorn.at
The response – the search result
Example response:
<room_availability_result xmlns="http://capcorn.at/"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<members>
<member hotel_id="9100">
<rooms>
<room>
<arrival>2025-12-17</arrival>
<departure>2025-12-20</departure>
<adults>2</adults>
<children>
<child age="3" />
</children>
<options>
<option>
<catc>DZ</catc>
<type>Doppelzimmer mit 1 Zustellbett</type>
<description>Zimmer Glemmtal 28 m² mit Dusche, seperatem WC,
Balkon, Kabel-TV, Safe, Fön</description>
<size>28</size>
<price>675</price>
<price_per_person>225</price_per_person>
<price_per_adult>337.5</price_per_adult>
<price_per_night>225</price_per_night>
<board>1</board>
<room_type>1</room_type>
</option>
<option>
<catc>FAMZ</catc>
<type>4-Bettzimmer für 3 Personen</type>
<description>Fam.Zimmer28m² (eingeschr. Aussicht ) Dusche,
WC, Balkon, TV, Safe, Fön</description>
<size>28</size>
<price>642.5</price>
<price_per_person>214.17</price_per_person>
<price_per_adult>321.25</price_per_adult>
<price_per_night>214.17</price_per_night>
<board>1</board>
<room_type>1</room_type>
</option>
</options>
</room>
<room>
<arrival>2020-12-17</arrival>
<departure>2020-12-20</departure>
<adults>2</adults>
<options>
<option>
<catc>DZK</catc>
<type>Doppelzimmer</type>
<description>Doppelzimmer Comfort 22 m² mit Dusche, WC,
Balkon, Kabel-TV, Zimmersafe, Fön</description>
<size>22</size>
<price>484</price>
<price_per_person>242</price_per_person>
<price_per_adult>242</price_per_adult>
<price_per_night>161.33</price_per_night>
Seite 2 / 6
CapCorn Company Software GmbH
Flugplatzstraße 52
5700 Zell am See
Tel. +43 (0) 6542 21021
support@capcorn.at
<board>1</board>
<room_type>1</room_type>
</option>
<option>
<catc>DZ</catc>
<type>Doppelzimmer</type>
<description>Zimmer Glemmtal 28 m² mit Dusche, seperatem WC,
Balkon, Kabel-TV, Safe, Fön</description>
<size>28</size>
<price>544</price>
<price_per_person>272</price_per_person>
<price_per_adult>272</price_per_adult>
<price_per_night>181.33</price_per_night>
<board>1</board>
<room_type>1</room_type>
</option>
</options>
</room>
</rooms>
</member>
</members>
</room_availability_result>
Die Response-Elemente im Detail:
</room_availability_result> <members> <member> hotel_id <rooms> Main node containing all information
Container containing 0…n available businesses
Node represents an available operation
Unique ID of the business in the CapCorn system
Container for 1-10 requested rooms, corresponds to the number of
rooms requested in the request
<room> <arrival> <departure> <adults> <children> Container for one room (one request line)
Arrival date in the format YYYY-MM-DD for this request line
Departure date in YYYY-MM-DD format for this request line
indicates how many adults the offered room is suitable for.
Containers the age information of the children that are taken into
account in this offer line (corresponds to the request)
<child> 0…8 nodes possible
age Attribute specifies the child's age in years (integer value between 1
and 17)
<options> Containers for bookable rooms according to the information from
arrival, departure, adults, etc.
<option> Container for information about the available room
<catc> Room category code
<type> General room name
<description> Room name or description provided by the landlord
<size> Size in square meters (integer value)
<price> Total price of the room
<price_per_person> Price per person (=price/(adults + number of children)) for this room
<price_per_adult> Price per adult for this room (=price/adults)
<price_per_night> Price per night for this room
<board> Included meals (Integer): 1=Breakfast, 2=Half board,
3=Full board, 4=No meals, 5=All inclusive
<room_type> Room type (1=hotel room, 2=apartment / holiday home)
Seite 3 / 6
CapCorn Company Software GmbH
Flugplatzstraße 52
5700 Zell am See
Tel. +43 (0) 6542 21021
support@capcorn.at
CapCorn interface for reservations
Bookings are imported via HTTP POST request to the following endpoint:
https://mainframe.capcorn.net/RestService/OTA_HotelResNotifRQ?hotelId=[hotel_id]&pin=[PIN]
For the tourism technology festival hackathon, the following credentials can be used:
Hotel-Id 9100
PIN Uv9-k_gYbmcsTHyU
Important: The HTTP header should be set to "Content-Type: application/xml".
Below is an example of how to import a booking. Details on individual parameters follow.
<?xml version="1.0" encoding="utf-8"?>
<OTA_HotelResNotifRQ xmlns:xsd="http://www.w3.org/2001/XMLSchema"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="1"
xmlns="http://www.opentravel.org/OTA/2003/05">
<POS>
<Source AgentDutyCode="Hackathon" />
</POS>
<HotelReservations>
<HotelReservation CreateDateTime="2025-10-26T09:43:08.9"
ResStatus="Book">
<RoomStays>
<RoomStay>
<RoomTypes>
<RoomType NumberOfUnits="1" RoomTypeCode="DZS" />
</RoomTypes>
<RatePlans>
<RatePlan>
<MealsIncluded MealPlanCodes="2" />
</RatePlan>
</RatePlans>
<GuestCounts IsPerRoom="true">
<GuestCount AgeQualifyingCode="10" Count="2" />
<GuestCount AgeQualifyingCode="8" Age="6" Count="1" />
</GuestCounts>
<TimeSpan Start="2026-01-24" End="2026-01-28" />
<Total AmountAfterTax="227.00" CurrencyCode="EUR" />
<BasicPropertyInfo HotelCode="9100" />
</RoomStay>
</RoomStays>
<Services>
<Service Quantity="2">
<ServiceDetails>
<ServiceDescription Name="Sport massage 30min" />
</ServiceDetails>
<Price>
<Base AmountAfterTax="50.00" />
</Price>
</Service>
<Service Quantity="1">
<ServiceDetails>
<ServiceDescription Name="Final cleaning" />
</ServiceDetails>
Seite 4 / 6
CapCorn Company Software GmbH
Flugplatzstraße 52
5700 Zell am See
Tel. +43 (0) 6542 21021
support@capcorn.at
<Price>
<Base AmountAfterTax="65.00" />
</Price>
</Service>
</Services>
<ResGuests>
<ResGuest>
<Profiles>
<ProfileInfo>
<Profile>
<Customer Language="de">
<PersonName>
<NamePrefix>Herr</NamePrefix>
<GivenName>Max</GivenName>
<Surname>Mustermann</Surname>
</PersonName>
<Telephone PhoneNumber="(+43)6641234567" />
<Email>support@capcorn.at</Email>
<Address>
<AddressLine>Fluplatzstraße 52</AddressLine>
<CityName>Zell am See</CityName>
<PostalCode>5700</PostalCode>
<CountryName Code="AT" />
</Address>
</Customer>
</Profile>
</ProfileInfo>
</Profiles>
<Comments>
<Comment>
<ListItem> We'll arrive around 2 PM. Cheers!</ListItem>
</Comment>
</Comments>
</ResGuest>
</ResGuests>
<ResGlobalInfo>
<HotelReservationIDs>
<HotelReservationID ResID_Value="659" ResID_Source="Hackathon" />
</HotelReservationIDs>
</ResGlobalInfo>
</HotelReservation>
</HotelReservations>
</OTA_HotelResNotifRQ>
In principle, the XML structure is largely self-explanatory and conforms to the OTA standard. Below
is important information on various booking parameters, listed according to their appearance in
the preceding example.
• <Source AgentDutyCode="[YourCode]" />
✓ Has to be [YourCode]
• <HotelReservation CreateDateTime="2025-10-26T09:43:08.9"
ResStatus="Book">
✓ Status must always be "Book"
✓ CreateDateTime corresponds to the time of the reservation in the external system.
• <RoomType NumberOfUnits="1" RoomTypeCode="DZS" />
✓ RoomTypeCode = category Code (max. 8 digits)
✓ NumberOfUnits = Number of booked rooms of this category
Seite 5 / 6
CapCorn Company Software GmbH
Flugplatzstraße 52
5700 Zell am See
Tel. +43 (0) 6542 21021
support@capcorn.at
• <MealsIncluded MealPlanCodes="2" />
✓ MealPlanCodes = Included meals -> 1=Breakfast, 2=Half board, 3=Full board, 4=No
meals, 5=All inclusive Included meals -> 1=Breakfast, 2=Half board, 3=Full board,
4=No meals, 5=All inclusive
• <GuestCounts IsPerRoom="true">
✓ Containers for occupancy in the room
✓ AgeQualifyingCode="10" identifier adults
✓ AgeQualifyingCode="8" identifies children up to 17 years of age
✓ For children, specifying their age in years via the parameter age is mandatory.
• <TimeSpan Start="2026-01-24" End="2026-01-28" />
✓ Start = Arrival date (in the format = YYYY-MM-DD)
✓ End = Departure date (in the format = YYYY-MM-DD)
• <Total AmountAfterTax="227.00" CurrencyCode="EUR" />
✓ Price for "all" rooms in this category without additional items (services container)
in Euros (price of a room = AmountAfterTax/NumberOfUnits), currency only
available in Euros.
• <BasicPropertyInfo HotelCode="9100" />
✓ HotelCode = CapCorn Hotel ID (numerical value)
• <Services>
✓ Container element for booked additional services
• <Service Quantity="2">
✓ Number of booked additional items (integer value)
• <ServiceDescription Name="Sportmassage 30min" />
✓ Name of the article
• <Base AmountAfterTax="50.00" />
✓ Price of the additional item (unit price) -> In the example above: 1 sports massage
for 30 minutes costs 50 euros, 2 were booked.
• <Profile>
✓ Container for the guest's data
• <NamePrefix>Herr</NamePrefix>
✓ salutation
• <Comment>
✓ Container for the <ListItem> which contains the guest's booking comment (max.
200 characters).
• <HotelReservationID ResID_Value="659850" ResID_Source="Hackathon" />
✓ ResID_Value = Booking ID in the external system (must be unique)
✓ ResID_Source = Name/Channel of the foreign system
Seite 6 / 6