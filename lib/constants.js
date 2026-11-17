// Shared by the server (validation) and the browser (UI)
export const PRIZES = [
  ['early5', 'Early Five', 'First 5 numbers on your ticket'],
  ['corners', 'Four Corners', 'Both end numbers of top and bottom rows'],
  ['top', 'Top Line', 'All 5 in the top row'],
  ['middle', 'Middle Line', 'All 5 in the middle row'],
  ['bottom', 'Bottom Line', 'All 5 in the bottom row'],
  ['queens', 'Queen’s House', 'All your numbers from 1 to 45'],
  ['kings', 'King’s House', 'All your numbers from 46 to 90'],
  ['full', 'Full House', 'All 15 numbers'],
];
export const PRIZE_NAME = Object.fromEntries(PRIZES.map(([k, n]) => [k, n]));
export const NICK = "|Single Haddi|Hum Do Hamare Do|Brahma Vishnu Mahesh|Char Log Kya Kahenge|Punjab Mail|Super Sixer|Thala for a Reason|Jalebi|Doctor’s Time|Perfect 10|Two Maggi Noodles|Midnight Dozen|Tera Kya Hoga Kaalia|Singles’ Crying Day|Independence Day|Solah Baras Ki Umar|Khatra Satra|Papa Ki Pari Gets a License|Unnees-Bees Ka Farak|Blind 20|Shaadi Ki Umar|Tu Tu Main Main|You and Me, Free Under a Tree|24-Carat Gold|25 Din Mein Paisa Double|Dry Day Alert|Gateway to Heaven|Out of State, Always Late|Almost 30|Tees Maar Khan|Baskin Robbins|Batteesi Dikha|Passing Marks|Yeh Dil Maange More|Aadha Pauna|Chattis Ka Aakda|Mixed Up Heaven|Too Many Samosas|Watch Your Line|Naughty Forty|Time for Some Fun|420 Minus Zero|Climb a Tree|Chor Machaye Shor|Halfway There|Chhakke Pe Chauka|AK-47|Late for the Date|Rise and Shine|Pachaas Tola|Shagun Ka Lifafa|Taash Ke Patte|Stuck in a Tree|Clean the Floor|Pachpan Mein Bachpan|Chappan Inch Ka Seena|Mangal Pandey|Time to Wait|Just Retired, Feel So Tired|Senior Citizen Ticket|Done with Fun|Turn the Screw|Tickle My Knee|Catch the Chor|Haddi Mein Dard|Chakke Pe Chakka|Made in Heaven|Put on Weight|Family Show Hai Bhai|Lucky Blind 70|Setting Sun|It’s a Zoo|Sipping Tea|Mera Desh Mahaan|Diamond Jubilee|Spirit of 76|Chak De India|Heaven’s Gate|End of the Line|Gandhi Ji Ka Chashma|Stop and Run|Fat Lady with a Duck|India’s First World Cup|84 Lakh Yoni|Staying Alive|Pick Up Sticks|Straight to Heaven|Gym Is Closed|Almost Made It|Last Bus Home".split('|');
