import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Crosshair, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { addPestReport, updatePestReport } from '../../firebase';

const CROPS     = ['Rice','Corn','Sibuyas','Mango'];
const STAGES    = ['Seedling','Vegetative','Reproductive','Ripening','Harvesting'];
const PROVINCES = ['Occidental Mindoro','Oriental Mindoro','Marinduque','Romblon','Palawan'];
const MUNICIPALITIES = {
  'Occidental Mindoro': ['Abra de Ilog','Calintaan','Looc','Lubang','Magsaysay','Mamburao','Paluan','Rizal','Sablayan','San Jose','Santa Cruz'],
  'Oriental Mindoro':   ['Baco','Bansud','Bongabong','Bulalacao','Calapan City','Gloria','Mansalay','Naujan','Pinamalayan','Pola','Puerto Galera','Roxas','San Teodoro','Socorro','Victoria'],
  'Marinduque':         ['Boac','Buenavista','Gasan','Mogpog','Santa Cruz','Torrijos'],
  'Romblon':            ['Alcantara','Banton','Cajidiocan','Calatrava','Concepcion','Corcuera','Ferrol','Looc','Magdiwang','Odiongan','Romblon','San Agustin','San Andres','San Fernando','San Jose','Santa Fe','Santa Maria'],
  'Palawan':            ['Aborlan','Agutaya','Araceli','Balabac','Bataraza',"Brooke's Point",'Cagayancillo','Coron','Culion','Cuyo','Dumaran','El Nido','Española','Kalayaan','Linapacan','Magsaysay','Narra','Puerto Princesa City','Quezon','Rizal','Roxas','San Vicente','Sofronio Española','Taytay'],
};

// Oriental Mindoro: Barangay (left) → Municipality (right)
const BARANGAY_MUNICIPALITY_RAW = `Alag, Baco
Bangkatan, Baco
Baras, Baco
Bayanan, Baco
Burbuli, Baco
Catwiran I, Baco
Catwiran II, Baco
Dulangan I, Baco
Dulangan II, Baco
Lantuyang, Baco
Lumang Bayan, Baco
Malapad, Baco
Mangangan I, Baco
Mangangan II, Baco
Mayabig, Baco
Pambisan, Baco
Poblacion, Baco
Pulang-Tubig, Baco
Putican-Cabulo, Baco
San Andres, Baco
San Ignacio, Baco
Santa Cruz, Baco
Santa Rosa I, Baco
Santa Rosa II, Baco
Tabon-tabon, Baco
Tagumpay, Baco
Water, Baco
Alcadesma, Bansud
Bato, Bansud
Conrazon, Bansud
Malo, Bansud
Manihala, Bansud
Pag-asa, Bansud
Poblacion, Bansud
Proper Bansud, Bansud
Proper Tiguisan, Bansud
Rosacara, Bansud
Salcedo, Bansud
Sumagui, Bansud
Villa Pag-asa, Bansud
Anilao, Bongabong
Aplaya, Bongabong
Bagumbayan I, Bongabong
Bagumbayan II, Bongabong
Batangan, Bongabong
Bukal, Bongabong
Camantigue, Bongabong
Carmundo, Bongabong
Cawayan, Bongabong
Dayhagan, Bongabong
Formon, Bongabong
Hagan, Bongabong
Hagupit, Bongabong
Ipil, Bongabong
Kaligtasan, Bongabong
Labasan, Bongabong
Labonan, Bongabong
Libertad, Bongabong
Lisap, Bongabong
Luna, Bongabong
Malitbog, Bongabong
Mapang, Bongabong
Masaguisi, Bongabong
Mina de Oro, Bongabong
Morente, Bongabong
Ogbot, Bongabong
Orconuma, Bongabong
Poblacion, Bongabong
Polusahi, Bongabong
Sagana, Bongabong
San Isidro, Bongabong
San Jose, Bongabong
San Juan, Bongabong
Santa Cruz, Bongabong
Sigange, Bongabong
Tawas, Bongabong
Bagong Sikat, Bulalacao
Balatasan, Bulalacao
Benli, Bulalacao
Cabugao, Bulalacao
Cambunang, Bulalacao
Campaasan, Bulalacao
Maasin, Bulalacao
Maujao, Bulalacao
Milagrosa, Bulalacao
Nasukob, Bulalacao
Poblacion, Bulalacao
San Francisco, Bulalacao
San Isidro, Bulalacao
San Juan, Bulalacao
San Roque, Bulalacao
Balingayan, Calapan
Balite, Calapan
Baruyan, Calapan
Batino, Calapan
Bayanan I, Calapan
Bayanan II, Calapan
Biga, Calapan
Bondoc, Calapan
Bucayao, Calapan
Buhuan, Calapan
Bulusan, Calapan
Calero, Calapan
Camansihan, Calapan
Camilmil, Calapan
Canubing I, Calapan
Canubing II, Calapan
Comunal, Calapan
Guinobatan, Calapan
Gulod, Calapan
Gutad, Calapan
Ibaba East, Calapan
Ibaba West, Calapan
Ilaya, Calapan
Lalud, Calapan
Lazareto, Calapan
Libis, Calapan
Lumang Bayan, Calapan
Mahal na Pangalan, Calapan
Maidlang, Calapan
Malad, Calapan
Malamig, Calapan
Managpi, Calapan
Masipit, Calapan
Nag-iba I, Calapan
Nag-iba II, Calapan
Navotas, Calapan
Pachoca, Calapan
Palhi, Calapan
Panggalaan, Calapan
Parang, Calapan
Patas, Calapan
Personas, Calapan
Putingtubig, Calapan
Salong, Calapan
San Antonio, Calapan
San Vicente Central, Calapan
San Vicente East, Calapan
San Vicente North, Calapan
San Vicente South, Calapan
San Vicente West, Calapan
Santa Cruz, Calapan
Santa Isabel, Calapan
Santa Maria Village, Calapan
Santa Rita, Calapan
Santo Niño, Calapan
Sapul, Calapan
Silonay, Calapan
Suqui, Calapan
Tawagan, Calapan
Tawiran, Calapan
Tibag, Calapan
Wawa, Calapan
Agos, Gloria
Agsalin, Gloria
Alma Villa, Gloria
Andres Bonifacio, Gloria
Balete, Gloria
Banus, Gloria
Banutan, Gloria
Bulaklakan, Gloria
Buong Lupa, Gloria
Gaudencio Antonino, Gloria
Guimbonan, Gloria
Kawit, Gloria
Lucio Laurel, Gloria
Macario Adriatico, Gloria
Malamig, Gloria
Malayong, Gloria
Maligaya, Gloria
Malubay, Gloria
Manguyang, Gloria
Maragooc, Gloria
Mirayan, Gloria
Narra, Gloria
Papandungin, Gloria
San Antonio, Gloria
Santa Maria, Gloria
Santa Theresa, Gloria
Tambong, Gloria
B. del Mundo, Mansalay
Balugo, Mansalay
Bonbon, Mansalay
Budburan, Mansalay
Cabalwa, Mansalay
Don Pedro, Mansalay
Maliwanag, Mansalay
Manaul, Mansalay
Panaytayan, Mansalay
Poblacion, Mansalay
Roma, Mansalay
Santa Brigida, Mansalay
Santa Maria, Mansalay
Santa Teresita, Mansalay
Villa Celestial, Mansalay
Wasig, Mansalay
Waygan, Mansalay
Adrialuna, Naujan
Andres Ilagan, Naujan
Antipolo, Naujan
Apitong, Naujan
Arangin, Naujan
Aurora, Naujan
Bacungan, Naujan
Bagong Buhay, Naujan
Balite, Naujan
Bancuro, Naujan
Banuton, Naujan
Barcenaga, Naujan
Bayani, Naujan
Buhangin, Naujan
Caburo, Naujan
Concepcion, Naujan
Dao, Naujan
Del Pilar, Naujan
Estrella, Naujan
Evangelista, Naujan
Gamao, Naujan
General Esco, Naujan
Herrera, Naujan
Inarawan, Naujan
Kalinisan, Naujan
Laguna, Naujan
Mabini, Naujan
Magtibay, Naujan
Mahabang Parang, Naujan
Malaya, Naujan
Malinao, Naujan
Malvar, Naujan
Masagana, Naujan
Masaguing, Naujan
Melgar A, Naujan
Melgar B, Naujan
Metolza, Naujan
Montelago, Naujan
Montemayor, Naujan
Motoderazo, Naujan
Mulawin, Naujan
Nag-iba I, Naujan
Nag-iba II, Naujan
Pagkakaisa, Naujan
Paitan, Naujan
Paniquian, Naujan
Pinagsabangan I, Naujan
Pinagsabangan II, Naujan
Piñahan, Naujan
Poblacion I, Naujan
Poblacion II, Naujan
Poblacion III, Naujan
Sampaguita, Naujan
San Agustin I, Naujan
San Agustin II, Naujan
San Andres, Naujan
San Antonio, Naujan
San Carlos, Naujan
San Isidro, Naujan
San Jose, Naujan
San Luis, Naujan
San Nicolas, Naujan
San Pedro, Naujan
Santa Cruz, Naujan
Santa Isabel, Naujan
Santa Maria, Naujan
Santiago, Naujan
Santo Niño, Naujan
Tagumpay, Naujan
Tigkan, Naujan
Anoling, Pinamalayan
Bacungan, Pinamalayan
Bangbang, Pinamalayan
Banilad, Pinamalayan
Buli, Pinamalayan
Cacawan, Pinamalayan
Calingag, Pinamalayan
Del Razon, Pinamalayan
Guinhawa, Pinamalayan
Inclanay, Pinamalayan
Lumangbayan, Pinamalayan
Malaya, Pinamalayan
Maliangcog, Pinamalayan
Maningcol, Pinamalayan
Marayos, Pinamalayan
Marfrancisco, Pinamalayan
Nabuslot, Pinamalayan
Pagalagala, Pinamalayan
Palayan, Pinamalayan
Pambisan Malaki, Pinamalayan
Pambisan Munti, Pinamalayan
Panggulayan, Pinamalayan
Papandayan, Pinamalayan
Pili, Pinamalayan
Quinabigan, Pinamalayan
Ranzo, Pinamalayan
Rosario, Pinamalayan
Sabang, Pinamalayan
Santa Isabel, Pinamalayan
Santa Maria, Pinamalayan
Santa Rita, Pinamalayan
Santo Niño, Pinamalayan
Wawa, Pinamalayan
Zone I, Pinamalayan
Zone II, Pinamalayan
Zone III, Pinamalayan
Zone IV, Pinamalayan
Bacawan, Pola
Bacungan, Pola
Batuhan, Pola
Bayanan, Pola
Biga, Pola
Buhay na Tubig, Pola
Calima, Pola
Calubasanhon, Pola
Campamento, Pola
Casiligan, Pola
Malibago, Pola
Maluanluan, Pola
Matulatula, Pola
Misong, Pola
Pahilahan, Pola
Panikihan, Pola
Pula, Pola
Puting Cacao, Pola
Tagbakin, Pola
Tagumpay, Pola
Tiguihan, Pola
Zone I, Pola
Zone II, Pola
Aninuan, Puerto Galera
Baclayan, Puerto Galera
Balatero, Puerto Galera
Dulangan, Puerto Galera
Palangan, Puerto Galera
Poblacion, Puerto Galera
Sabang, Puerto Galera
San Antonio, Puerto Galera
San Isidro, Puerto Galera
Santo Niño, Puerto Galera
Sinandigan, Puerto Galera
Tabinay, Puerto Galera
Villaflor, Puerto Galera
Bagumbayan, Roxas
Cantil, Roxas
Dangay, Roxas
Happy Valley, Roxas
Libertad, Roxas
Libtong, Roxas
Little Tanauan, Roxas
Mabuhay, Roxas
Maraska, Roxas
Odiong, Roxas
Paclasan, Roxas
San Aquilino, Roxas
San Isidro, Roxas
San Jose, Roxas
San Mariano, Roxas
San Miguel, Roxas
San Rafael, Roxas
San Vicente, Roxas
Uyao, Roxas
Victoria, Roxas
Bigaan, San Teodoro
Caagutayan, San Teodoro
Calangatan, San Teodoro
Calsapa, San Teodoro
Ilag, San Teodoro
Lumangbayan, San Teodoro
Poblacion, San Teodoro
Tacligan, San Teodoro
Bagsok, Socorro
Batong Dalig, Socorro
Bayuin, Socorro
Bugtong na Tuog, Socorro
Calocmoy, Socorro
Calubayan, Socorro
Catiningan, Socorro
Fortuna, Socorro
Happy Valley, Socorro
Leuteboro I, Socorro
Leuteboro II, Socorro
Ma. Concepcion, Socorro
Mabuhay I, Socorro
Mabuhay II, Socorro
Malugay, Socorro
Matungao, Socorro
Monteverde, Socorro
Pasi I, Socorro
Pasi II, Socorro
Santo Domingo, Socorro
Subaan, Socorro
Villareal, Socorro
Zone I, Socorro
Zone II, Socorro
Zone III, Socorro
Zone IV, Socorro
Alcate, Victoria
Antonino, Victoria
Babangonan, Victoria
Bagong Buhay, Victoria
Bagong Silang, Victoria
Bambanin, Victoria
Bethel, Victoria
Canaan, Victoria
Concepcion, Victoria
Duongan, Victoria
Jose Leido Jr., Victoria
Loyal, Victoria
Mabini, Victoria
Macatoc, Victoria
Malabo, Victoria
Merit, Victoria
Ordovilla, Victoria
Pakyas, Victoria
Poblacion I, Victoria
Poblacion II, Victoria
Poblacion III, Victoria
Poblacion IV, Victoria
Sampaguita, Victoria
San Antonio, Victoria
San Cristobal, Victoria
San Gabriel, Victoria
San Gelacio, Victoria
San Isidro, Victoria
San Juan, Victoria
San Narciso, Victoria
Urdaneta, Victoria
Villa Cerveza, Victoria`;
const BARANGAY_MUNICIPALITY = BARANGAY_MUNICIPALITY_RAW.trim().split('\n').map(line => {
  const idx = line.lastIndexOf(',');
  const barangay = line.slice(0, idx).trim();
  const municipality = line.slice(idx + 1).trim();
  return { barangay, municipality };
});
const ORIENTAL_MUNICIPALITIES = [...new Set(BARANGAY_MUNICIPALITY.map(x => x.municipality))].sort();

// Occidental Mindoro: Barangay (left) → Municipality (right)
const BARANGAY_MUNICIPALITY_OCCIDENTAL_RAW = `Armado, Abra de Ilog
Balao, Abra de Ilog
Cabacao, Abra de Ilog
Lumangbayan, Abra de Ilog
Poblacion, Abra de Ilog
San Vicente, Abra de Ilog
Santa Maria, Abra de Ilog
Tibag, Abra de Ilog
Udalo, Abra de Ilog
Wawa, Abra de Ilog
Concepcion, Calintaan
Iriron, Calintaan
Malpalon, Calintaan
New Dagupan, Calintaan
Poblacion, Calintaan
Poypoy, Calintaan
Tanyag, Calintaan
Agkawayan, Looc
Ambil, Looc
Balikyas, Looc
Bonbon, Looc
Bulacan, Looc
Burol, Looc
Guitna, Looc
Kanluran, Looc
Talaotao, Looc
Araw at Bituin, Lubang
Bagong Sikat, Lubang
Banaag at Pag-asa, Lubang
Binakas, Lubang
Cabra, Lubang
Likas ng Silangan, Lubang
Maginhawa, Lubang
Maligaya, Lubang
Maliig, Lubang
Ninikat ng Pag-asa, Lubang
Paraiso, Lubang
Surville, Lubang
Tagbac, Lubang
Tangal, Lubang
Tilik, Lubang
Vigo, Lubang
Alibog, Magsaysay
Caguray, Magsaysay
Calawag, Magsaysay
Gapasan, Magsaysay
Laste, Magsaysay
Lourdes, Magsaysay
Nicolas, Magsaysay
Paclolo, Magsaysay
Poblacion, Magsaysay
Purnaga, Magsaysay
Santa Teresa, Magsaysay
Sibalat, Magsaysay
Balansay, Mamburao
Fatima, Mamburao
Payompon, Mamburao
Poblacion 1, Mamburao
Poblacion 2, Mamburao
Poblacion 3, Mamburao
Poblacion 4, Mamburao
Poblacion 5, Mamburao
Poblacion 6, Mamburao
Poblacion 7, Mamburao
Poblacion 8, Mamburao
San Luis, Mamburao
Talabaan, Mamburao
Tangkalan, Mamburao
Tayamaan, Mamburao
Alipaoy, Paluan
Bagong Silang Poblacion, Paluan
Handang Tumulong Poblacion, Paluan
Harrison, Paluan
Lumangbayan, Paluan
Mananao, Paluan
Mapalad Poblacion, Paluan
Marikit, Paluan
Pag-asa ng Bayan Poblacion, Paluan
San Jose Poblacion, Paluan
Silahis ng Pag-asa Poblacion, Paluan
Tubili, Paluan
Adela, Rizal
Aguas, Rizal
Magsikap, Rizal
Malawaan, Rizal
Manoot, Rizal
Pitogo, Rizal
Rizal, Rizal
Rumbang, Rizal
Salvacion, Rizal
San Pedro, Rizal
Santo Niño, Rizal
Batong Buhay, Sablayan
Buenavista, Sablayan
Burgos, Sablayan
Claudio Salgado, Sablayan
General Emilio Aguinaldo, Sablayan
Ibud, Sablayan
Ilvita, Sablayan
Lagnas, Sablayan
Ligaya, Sablayan
Malisbong, Sablayan
Paetan, Sablayan
Pag-asa, Sablayan
Poblacion, Sablayan
San Agustin, Sablayan
San Francisco, Sablayan
San Nicolas, Sablayan
San Vicente, Sablayan
Santa Lucia, Sablayan
Santo Niño, Sablayan
Tagumpay, Sablayan
Tuban, Sablayan
Victoria, Sablayan
Ambulong, San Jose
Ansiray, San Jose
Bagong Sikat, San Jose
Bangkal, San Jose
Barangay 1, San Jose
Barangay 2, San Jose
Barangay 3, San Jose
Barangay 4, San Jose
Barangay 5, San Jose
Barangay 6, San Jose
Barangay 7, San Jose
Barangay 8, San Jose
Batasan, San Jose
Bayotbot, San Jose
Bubog, San Jose
Buri, San Jose
Camburay, San Jose
Caminawit, San Jose
Catayungan, San Jose
Central, San Jose
Iling Proper, San Jose
Inasakan, San Jose
Ipil, San Jose
La Curva, San Jose
Labangan Iling, San Jose
Labangan Poblacion, San Jose
Mabini, San Jose
Magbay, San Jose
Mangarin, San Jose
Mapaya, San Jose
Monte Claro, San Jose
Murtha, San Jose
Naibuan, San Jose
Natandol, San Jose
Pag-asa, San Jose
Pawican, San Jose
San Agustin, San Jose
San Isidro, San Jose
San Roque, San Jose
Alacaak, Santa Cruz
Barahan, Santa Cruz
Casague, Santa Cruz
Dayap, Santa Cruz
Kurtinganan, Santa Cruz
Lumangbayan, Santa Cruz
Mulawin, Santa Cruz
Pinagturilan, Santa Cruz
Poblacion I, Santa Cruz
Poblacion II, Santa Cruz
San Vicente, Santa Cruz`;
const BARANGAY_MUNICIPALITY_OCCIDENTAL = BARANGAY_MUNICIPALITY_OCCIDENTAL_RAW.trim().split('\n').map(line => {
  const idx = line.lastIndexOf(',');
  const barangay = line.slice(0, idx).trim();
  const municipality = line.slice(idx + 1).trim();
  return { barangay, municipality };
});
const OCCIDENTAL_MUNICIPALITIES = [...new Set(BARANGAY_MUNICIPALITY_OCCIDENTAL.map(x => x.municipality))].sort();

// Marinduque: Barangay (left) → Municipality (right)
const BARANGAY_MUNICIPALITY_MARINDUQUE_RAW = `Agot, Boac
Agumaymayan, Boac
Amoingon, Boac
Apitong, Boac
Balagasan, Boac
Balaring, Boac
Balimbing, Boac
Balogo, Boac
Bamban, Boac
Bangbangalon, Boac
Bantad, Boac
Bantay, Boac
Bayuti, Boac
Binunga, Boac
Boi, Boac
Boton, Boac
Buliasnin, Boac
Bunganay, Boac
Caganhao, Boac
Canat, Boac
Catubugan, Boac
Cawit, Boac
Daig, Boac
Daypay, Boac
Duyay, Boac
Hinapulan, Boac
Ihatub, Boac
Isok I, Boac
Isok II Poblacion, Boac
Laylay, Boac
Lupac, Boac
Mahinhin, Boac
Mainit, Boac
Malbog, Boac
Maligaya, Boac
Malusak, Boac
Mansiwat, Boac
Mataas na Bayan, Boac
Maybo, Boac
Mercado, Boac
Murallon, Boac
Ogbac, Boac
Pawa, Boac
Pili, Boac
Poctoy, Boac
Poras, Boac
Puting Buhangin, Boac
Puyog, Boac
Sabong, Boac
San Miguel, Boac
Santol, Boac
Sawi, Boac
Tabi, Boac
Tabigue, Boac
Tagwak, Boac
Tambunan, Boac
Tampus, Boac
Tanza, Boac
Tugos, Boac
Tumagabok, Boac
Tumapon, Boac
Bagacay, Buenavista
Bagtingon, Buenavista
Barangay I, Buenavista
Barangay II, Buenavista
Barangay III, Buenavista
Barangay IV, Buenavista
Bicas-bicas, Buenavista
Caigangan, Buenavista
Daykitin, Buenavista
Libas, Buenavista
Malbog, Buenavista
Sihi, Buenavista
Timbo, Buenavista
Tungib-Lipata, Buenavista
Yook, Buenavista
Antipolo, Gasan
Bachao Ibaba, Gasan
Bachao Ilaya, Gasan
Bacongbacong, Gasan
Bahi, Gasan
Bangbang, Gasan
Banot, Gasan
Banuyo, Gasan
Barangay I, Gasan
Barangay II, Gasan
Barangay III, Gasan
Bognuyan, Gasan
Cabugao, Gasan
Dawis, Gasan
Dili, Gasan
Libtangin, Gasan
Mahunig, Gasan
Mangiliol, Gasan
Masiga, Gasan
Matandang Gasan, Gasan
Pangi, Gasan
Pingan, Gasan
Tabionan, Gasan
Tapuyan, Gasan
Tiguion, Gasan
Anapog-Sibucao, Mogpog
Argao, Mogpog
Balanacan, Mogpog
Banto, Mogpog
Bintakay, Mogpog
Bocboc, Mogpog
Butansapa, Mogpog
Candahon, Mogpog
Capayang, Mogpog
Danao, Mogpog
Dulong Bayan, Mogpog
Gitnang Bayan, Mogpog
Guisian, Mogpog
Hinadharan, Mogpog
Hinanggayon, Mogpog
Ino, Mogpog
Janagdong, Mogpog
Lamesa, Mogpog
Laon, Mogpog
Magapua, Mogpog
Malayak, Mogpog
Malusak, Mogpog
Mampaitan, Mogpog
Mangyan-Mababad, Mogpog
Market Site, Mogpog
Mataas na Bayan, Mogpog
Mendez, Mogpog
Nangka I, Mogpog
Nangka II, Mogpog
Paye, Mogpog
Pili, Mogpog
Puting Buhangin, Mogpog
Sayao, Mogpog
Silangan, Mogpog
Sumangga, Mogpog
Tarug, Mogpog
Villa Mendez, Mogpog
Alobo, Santa Cruz
Angas, Santa Cruz
Aturan, Santa Cruz
Bagong Silang Poblacion, Santa Cruz
Baguidbirin, Santa Cruz
Baliis, Santa Cruz
Balogo, Santa Cruz
Banahaw Poblacion, Santa Cruz
Bangcuangan, Santa Cruz
Banogbog, Santa Cruz
Biga, Santa Cruz
Botilao, Santa Cruz
Buyabod, Santa Cruz
Dating Bayan, Santa Cruz
Devilla, Santa Cruz
Dolores, Santa Cruz
Haguimit, Santa Cruz
Hupi, Santa Cruz
Ipil, Santa Cruz
Jolo, Santa Cruz
Kaganhao, Santa Cruz
Kalangkang, Santa Cruz
Kamandugan, Santa Cruz
Kasily, Santa Cruz
Kilo-kilo, Santa Cruz
Kiñaman, Santa Cruz
Labo, Santa Cruz
Lamesa, Santa Cruz
Landy, Santa Cruz
Lapu-lapu Poblacion, Santa Cruz
Libjo, Santa Cruz
Lipa, Santa Cruz
Lusok, Santa Cruz
Maharlika Poblacion, Santa Cruz
Makulapnit, Santa Cruz
Maniwaya, Santa Cruz
Manlibunan, Santa Cruz
Masaguisi, Santa Cruz
Masalukot, Santa Cruz
Matalaba, Santa Cruz
Mongpong, Santa Cruz
Morales, Santa Cruz
Napo, Santa Cruz
Pag-asa Poblacion, Santa Cruz
Pantayin, Santa Cruz
Polo, Santa Cruz
Pulong-Parang, Santa Cruz
Punong, Santa Cruz
San Antonio, Santa Cruz
San Isidro, Santa Cruz
Tagum, Santa Cruz
Tamayo, Santa Cruz
Tambangan, Santa Cruz
Tawiran, Santa Cruz
Taytay, Santa Cruz
Bangwayin, Torrijos
Bayakbakin, Torrijos
Bolo, Torrijos
Bonliw, Torrijos
Buangan, Torrijos
Cabuyo, Torrijos
Cagpo, Torrijos
Dampulan, Torrijos
Kay Duke, Torrijos
Mabuhay, Torrijos
Makawayan, Torrijos
Malibago, Torrijos
Malinao, Torrijos
Maranlig, Torrijos
Marlangga, Torrijos
Matuyatuya, Torrijos
Nangka, Torrijos
Pakaskasan, Torrijos
Payanas, Torrijos
Poblacion, Torrijos
Poctoy, Torrijos
Sibuyao, Torrijos
Suha, Torrijos
Talawan, Torrijos
Tigwi, Torrijos`;
const BARANGAY_MUNICIPALITY_MARINDUQUE = BARANGAY_MUNICIPALITY_MARINDUQUE_RAW.trim().split('\n').map(line => {
  const idx = line.lastIndexOf(',');
  const barangay = line.slice(0, idx).trim();
  const municipality = line.slice(idx + 1).trim();
  return { barangay, municipality };
});
const MARINDUQUE_MUNICIPALITIES = [...new Set(BARANGAY_MUNICIPALITY_MARINDUQUE.map(x => x.municipality))].sort();

// Romblon: Barangay (left) → Municipality (right)
const BARANGAY_MUNICIPALITY_ROMBLON_RAW = `Bagsik, Alcantara
Bonlao, Alcantara
Calagonsao, Alcantara
Camili, Alcantara
Camod-om, Alcantara
Gui-ob, Alcantara
Lawan, Alcantara
Madalag, Alcantara
Poblacion, Alcantara
San Isidro, Alcantara
San Roque, Alcantara
Tugdan, Alcantara
Balogo, Banton
Banice, Banton
Hambi-an, Banton
Lagang, Banton
Libtong, Banton
Mainit, Banton
Nabalay, Banton
Nasunogan, Banton
Poblacion, Banton
Sibay, Banton
Tan-ag, Banton
Toctoc, Banton
Togbongan, Banton
Togong, Banton
Tumalum, Banton
Tungonan, Banton
Yabawon, Banton
Alibagon, Cajidiocan
Cambajao, Cajidiocan
Cambalo, Cajidiocan
Cambijang, Cajidiocan
Cantagda, Cajidiocan
Danao, Cajidiocan
Gutivan, Cajidiocan
Lico, Cajidiocan
Lumbang Este, Cajidiocan
Lumbang Weste, Cajidiocan
Marigondon, Cajidiocan
Poblacion, Cajidiocan
Sugod, Cajidiocan
Taguilos, Cajidiocan
Balogo, Calatrava
Linao, Calatrava
Pagsangahan, Calatrava
Pangulo, Calatrava
Poblacion, Calatrava
San Roque, Calatrava
Talisay, Calatrava
Bachawan, Concepcion
Calabasahan, Concepcion
Dalajican, Concepcion
Masadya, Concepcion
Masudsud, Concepcion
Poblacion, Concepcion
Sampong, Concepcion
San Pedro, Concepcion
San Vicente, Concepcion
Alegria, Corcuera
Ambulong, Corcuera
Colongcolong, Corcuera
Gobon, Corcuera
Guintiguiban, Corcuera
Ilijan, Corcuera
Labnig, Corcuera
Mabini, Corcuera
Mahaba, Corcuera
Mangansag, Corcuera
Poblacion, Corcuera
San Agustin, Corcuera
San Roque, Corcuera
San Vicente, Corcuera
Tacasan, Corcuera
Agnonoc, Ferrol
Bunsoran, Ferrol
Claro M. Recto, Ferrol
Hinaguman, Ferrol
Poblacion, Ferrol
Tubigon, Ferrol
Agojo, Looc
Balatucan, Looc
Buenavista, Looc
Camandao, Looc
Guinhayaan, Looc
Limon Norte, Looc
Limon Sur, Looc
Manhac, Looc
Pili, Looc
Poblacion, Looc
Punta, Looc
Tuguis, Looc
Agsao, Magdiwang
Agutay, Magdiwang
Ambulong, Magdiwang
Dulangan, Magdiwang
Ipil, Magdiwang
Jao-asan, Magdiwang
Poblacion, Magdiwang
Silum, Magdiwang
Tampayan, Magdiwang
Amatong, Odiongan
Anahao, Odiongan
Bangon, Odiongan
Batiano, Odiongan
Budiong, Odiongan
Canduyong, Odiongan
Dapawan, Odiongan
Gabawan, Odiongan
Libertad, Odiongan
Ligaya, Odiongan
Liwanag, Odiongan
Liwayway, Odiongan
Malilico, Odiongan
Mayha, Odiongan
Panique, Odiongan
Pato-o, Odiongan
Poctoy, Odiongan
Progreso Este, Odiongan
Progreso Weste, Odiongan
Rizal, Odiongan
Tabing Dagat, Odiongan
Tabobo-an, Odiongan
Tuburan, Odiongan
Tulay, Odiongan
Tumingad, Odiongan
Agbaluto, Romblon
Agbudia, Romblon
Agnaga, Romblon
Agnay, Romblon
Agnipa, Romblon
Agpanabat, Romblon
Agtongo, Romblon
Alad, Romblon
Bagacay, Romblon
Barangay I, Romblon
Barangay II, Romblon
Barangay III, Romblon
Barangay IV, Romblon
Cajimos, Romblon
Calabogo, Romblon
Capaclan, Romblon
Cobrador, Romblon
Ginablan, Romblon
Guimpingan, Romblon
Ilauran, Romblon
Lamao, Romblon
Li-o, Romblon
Logbon, Romblon
Lonos, Romblon
Lunas, Romblon
Macalas, Romblon
Mapula, Romblon
Palje, Romblon
Sablayan, Romblon
Sawang, Romblon
Tambac, Romblon
Bachawan, San Agustin
Binongahan, San Agustin
Binugusan, San Agustin
Buli, San Agustin
Cabolutan, San Agustin
Cagbuaya, San Agustin
Camantaya, San Agustin
Carmen, San Agustin
Cawayan, San Agustin
Doña Juana, San Agustin
Dubduban, San Agustin
Lusong, San Agustin
Mahabang Baybay, San Agustin
Poblacion, San Agustin
Sugod, San Agustin
Agpudlos, San Andres
Calunacon, San Andres
Doña Trinidad, San Andres
Juncarlo, San Andres
Linawan, San Andres
Mabini, San Andres
Marigondon Norte, San Andres
Marigondon Sur, San Andres
Matutuna, San Andres
Pag-alad, San Andres
Poblacion, San Andres
Tan-agan, San Andres
Victoria, San Andres
Agtiwa, San Fernando
Azarga, San Fernando
Campalingo, San Fernando
Canjalon, San Fernando
España, San Fernando
Mabini, San Fernando
Mabulo, San Fernando
Otod, San Fernando
Panangcalan, San Fernando
Pili, San Fernando
Poblacion, San Fernando
Taclobo, San Fernando
Busay, San Jose
Combot, San Jose
Lanas, San Jose
Pinamihagan, San Jose
Poblacion, San Jose
Agmanic, Santa Fe
Canyayo, Santa Fe
Danao Norte, Santa Fe
Danao Sur, Santa Fe
Guinbirayan, Santa Fe
Guintigbasan, Santa Fe
Magsaysay, Santa Fe
Mat-i, Santa Fe
Pandan, Santa Fe
Poblacion, Santa Fe
Tabugon, Santa Fe
Bonga, Santa Maria
Concepcion Norte, Santa Maria
Concepcion Sur, Santa Maria
Paroyhog, Santa Maria
San Isidro, Santa Maria
Santo Niño, Santa Maria`;
const BARANGAY_MUNICIPALITY_ROMBLON = BARANGAY_MUNICIPALITY_ROMBLON_RAW.trim().split('\n').map(line => {
  const idx = line.lastIndexOf(',');
  const barangay = line.slice(0, idx).trim();
  const municipality = line.slice(idx + 1).trim();
  return { barangay, municipality };
});
const ROMBLON_MUNICIPALITIES = [...new Set(BARANGAY_MUNICIPALITY_ROMBLON.map(x => x.municipality))].sort();

// Palawan: Barangay (left) → Municipality (right)
const BARANGAY_MUNICIPALITY_PALAWAN_RAW = `Apo-Aporawan, Aborlan
Apoc-apoc, Aborlan
Aporawan, Aborlan
Barake, Aborlan
Cabigaan, Aborlan
Culandanum, Aborlan
Gogognan, Aborlan
Iraan, Aborlan
Isaub, Aborlan
Jose Rizal, Aborlan
Mabini, Aborlan
Magbabadil, Aborlan
Plaridel, Aborlan
Poblacion, Aborlan
Ramon Magsaysay, Aborlan
Sagpangan, Aborlan
San Juan, Aborlan
Tagpait, Aborlan
Tigman, Aborlan
Abagat, Agutaya
Algeciras, Agutaya
Bangcal, Agutaya
Cambian, Agutaya
Concepcion, Agutaya
Diit, Agutaya
Maracanao, Agutaya
Matarawis, Agutaya
Villafria, Agutaya
Villasol, Agutaya
Balogo, Araceli
Dagman, Araceli
Dalayawon, Araceli
Lumacad, Araceli
Madoldolon, Araceli
Mauringuen, Araceli
Osmeña, Araceli
Poblacion, Araceli
San Jose de Oro, Araceli
Santo Niño, Araceli
Taloto, Araceli
Tinintinan, Araceli
Tudela, Araceli
Agutayan, Balabac
Bancalaan, Balabac
Bugsuk, Balabac
Catagupan, Balabac
Indalawan, Balabac
Malaking Ilog, Balabac
Mangsee, Balabac
Melville, Balabac
Pandanan, Balabac
Pasig, Balabac
Poblacion I, Balabac
Poblacion II, Balabac
Poblacion III, Balabac
Poblacion IV, Balabac
Poblacion V, Balabac
Poblacion VI, Balabac
Rabor, Balabac
Ramos, Balabac
Salang, Balabac
Sebaring, Balabac
Bono-bono, Bataraza
Bulalacao, Bataraza
Buliluyan, Bataraza
Culandanum, Bataraza
Igang-igang, Bataraza
Inogbong, Bataraza
Iwahig, Bataraza
Malihud, Bataraza
Malitub, Bataraza
Marangas, Bataraza
Ocayan, Bataraza
Puring, Bataraza
Rio Tuba, Bataraza
Sandoval, Bataraza
Sapa, Bataraza
Sarong, Bataraza
Sumbiling, Bataraza
Tabud, Bataraza
Tagnato, Bataraza
Tagolango, Bataraza
Taratak, Bataraza
Tarusan, Bataraza
Amas, Brooke's Point
Aribungos, Brooke's Point
Barong-barong, Brooke's Point
Calasaguen, Brooke's Point
Imulnod, Brooke's Point
Ipilan, Brooke's Point
Maasin, Brooke's Point
Mainit, Brooke's Point
Malis, Brooke's Point
Mambalot, Brooke's Point
Oring-oring, Brooke's Point
Pangobilian, Brooke's Point
Poblacion I, Brooke's Point
Poblacion II, Brooke's Point
Salogon, Brooke's Point
Samareñana, Brooke's Point
Saraza, Brooke's Point
Tubtub, Brooke's Point
Bogtong, Busuanga
Buluang, Busuanga
Cheey, Busuanga
Concepcion, Busuanga
Maglalambay, Busuanga
New Busuanga, Busuanga
Old Busuanga, Busuanga
Panlaitan, Busuanga
Quezon, Busuanga
Sagrada, Busuanga
Salvacion, Busuanga
San Isidro, Busuanga
San Rafael, Busuanga
Santo Niño, Busuanga
Bantayan, Cagayancillo
Calsada, Cagayancillo
Convento, Cagayancillo
Lipot North, Cagayancillo
Lipot South, Cagayancillo
Magsaysay, Cagayancillo
Mampio, Cagayancillo
Nusa, Cagayancillo
Santa Cruz, Cagayancillo
Tacas, Cagayancillo
Talaga, Cagayancillo
Wahig, Cagayancillo
Banuang Daan, Coron
Barangay I, Coron
Barangay II, Coron
Barangay III, Coron
Barangay IV, Coron
Barangay V, Coron
Barangay VI, Coron
Bintuan, Coron
Borac, Coron
Buenavista, Coron
Bulalacao, Coron
Cabugao, Coron
Decabobo, Coron
Decalachao, Coron
Guadalupe, Coron
Lajala, Coron
Malawig, Coron
Marcilla, Coron
San Jose, Coron
San Nicolas, Coron
Tagumpay, Coron
Tara, Coron
Turda, Coron
Balala, Culion
Baldat, Culion
Binudac, Culion
Burabod, Culion
Culango, Culion
De Carabao, Culion
Galoc, Culion
Halsey, Culion
Jardin, Culion
Libis, Culion
Luac, Culion
Malaking Patag, Culion
Osmeña, Culion
Tiza, Culion
Balading, Cuyo
Bangcal, Cuyo
Cabigsing, Cuyo
Caburian, Cuyo
Caponayan, Cuyo
Catadman, Cuyo
Funda, Cuyo
Lagaoriao, Cuyo
Lubid, Cuyo
Lungsod, Cuyo
Manamoc, Cuyo
Maringian, Cuyo
Pawa, Cuyo
San Carlos, Cuyo
Suba, Cuyo
Tenga-tenga, Cuyo
Tocadan, Cuyo
Bacao, Dumaran
Bohol, Dumaran
Calasag, Dumaran
Capayas, Dumaran
Catep, Dumaran
Culasian, Dumaran
Danleg, Dumaran
Dumaran, Dumaran
Ilian, Dumaran
Itangil, Dumaran
Magsaysay, Dumaran
San Juan, Dumaran
Santa Maria, Dumaran
Santa Teresita, Dumaran
Santo Tomas, Dumaran
Tanatanaon, Dumaran
Aberawan, El Nido
Bagong Bayan, El Nido
Barotuan, El Nido
Bebeladan, El Nido
Bucana, El Nido
Buena Suerte Poblacion, El Nido
Corong-corong Poblacion, El Nido
Mabini, El Nido
Maligaya Poblacion, El Nido
Manlag, El Nido
Masagana Poblacion, El Nido
New Ibajay, El Nido
Pasadeña, El Nido
San Fernando, El Nido
Sibaltan, El Nido
Teneguiban, El Nido
Villa Libertad, El Nido
Villa Paz, El Nido
Pag-asa, Kalayaan
Barangonan, Linapacan
Cabunlawan, Linapacan
Calibangbangan, Linapacan
Decabaitot, Linapacan
Maroyogroyog, Linapacan
Nangalao, Linapacan
New Culaylayan, Linapacan
Pical, Linapacan
San Miguel, Linapacan
San Nicolas, Linapacan
Alcoba, Magsaysay
Balaguen, Magsaysay
Canipo, Magsaysay
Cocoro, Magsaysay
Danawan, Magsaysay
Emilod, Magsaysay
Igabas, Magsaysay
Lacaren, Magsaysay
Los Angeles, Magsaysay
Lucbuan, Magsaysay
Rizal, Magsaysay
Antipuluan, Narra
Aramaywan, Narra
Bagong Sikat, Narra
Batang-batang, Narra
Bato-bato, Narra
Burirao, Narra
Caguisan, Narra
Calategas, Narra
Dumagueña, Narra
Elvita, Narra
Estrella Village, Narra
Ipilan, Narra
Malatgao, Narra
Malinao, Narra
Narra, Narra
Panacan, Narra
Panacan 2, Narra
Princess Urduja, Narra
Sandoval, Narra
Tacras, Narra
Taritien, Narra
Teresa, Narra
Tinagong Dagat, Narra
Alfonso XIII, Quezon
Aramaywan, Quezon
Berong, Quezon
Calatagbak, Quezon
Calumpang, Quezon
Isugod, Quezon
Maasin, Quezon
Malatgao, Quezon
Panitian, Quezon
Pinaglabanan, Quezon
Quinlogan, Quezon
Sowangan, Quezon
Tabon, Quezon
Tagusao, Quezon
Bunog, Rizal
Campong Ulay, Rizal
Candawaga, Rizal
Canipaan, Rizal
Culasian, Rizal
Iraan, Rizal
Latud, Rizal
Panalingaan, Rizal
Punta Baja, Rizal
Ransang, Rizal
Taburi, Rizal
Abaroan, Roxas
Antonino, Roxas
Bagong Bayan, Roxas
Barangay 1, Roxas
Barangay II, Roxas
Barangay III, Roxas
Barangay IV, Roxas
Barangay V Poblacion, Roxas
Barangay VI Poblacion, Roxas
Caramay, Roxas
Dumarao, Roxas
Iraan, Roxas
Jolo, Roxas
Magara, Roxas
Malcampo, Roxas
Mendoza, Roxas
Narra, Roxas
New Barbacan, Roxas
New Cuyo, Roxas
Nicanor Zabala, Roxas
Rizal, Roxas
Salvacion, Roxas
San Isidro, Roxas
San Jose, Roxas
San Miguel, Roxas
San Nicolas, Roxas
Sandoval, Roxas
Tagumpay, Roxas
Taradungan, Roxas
Tinitian, Roxas
Tumarbong, Roxas
Alimanguan, San Vicente
Binga, San Vicente
Caruray, San Vicente
Kemdeng, San Vicente
New Agutaya, San Vicente
New Canipo, San Vicente
Poblacion, San Vicente
Port Barton, San Vicente
San Isidro, San Vicente
Santo Niño, San Vicente
Abo-abo, Sofronio Española
Iraray, Sofronio Española
Isumbo, Sofronio Española
Labog, Sofronio Española
Panitian, Sofronio Española
Pulot Center, Sofronio Española
Pulot Interior, Sofronio Española
Pulot Shore, Sofronio Española
Punang, Sofronio Española
Abongan, Taytay
Alacalian, Taytay
Banbanan, Taytay
Bantulan, Taytay
Baras, Taytay
Batas, Taytay
Bato, Taytay
Beton, Taytay
Busy Bees, Taytay
Calawag, Taytay
Casian, Taytay
Cataban, Taytay
Debangan, Taytay
Depla, Taytay
Libertad, Taytay
Liminangcong, Taytay
Meytegued, Taytay
Minapla, Taytay
New Guinlo, Taytay
Old Guinlo, Taytay
Paglaum, Taytay
Paly, Taytay
Pamantolon, Taytay
Pancol, Taytay
Poblacion, Taytay
Pularaquen, Taytay
San Jose, Taytay
Sandoval, Taytay
Silanga, Taytay
Talog, Taytay
Tumbod, Taytay`;
const BARANGAY_MUNICIPALITY_PALAWAN = BARANGAY_MUNICIPALITY_PALAWAN_RAW.trim().split('\n').map(line => {
  const idx = line.lastIndexOf(',');
  const barangay = line.slice(0, idx).trim();
  const municipality = line.slice(idx + 1).trim();
  return { barangay, municipality };
});
const PALAWAN_MUNICIPALITIES = [...new Set(BARANGAY_MUNICIPALITY_PALAWAN.map(x => x.municipality))].sort();
const PESTS_BY_CROP = {
  Rice:    ['Brown Planthopper','Stem Borer','Leaf Folder','Blast','Tungro','Sheath Blight'],
  Corn:    ['Fall Armyworm','Corn Earworm','Aphids','Downy Mildew','Gray Leaf Spot'],
  Sibuyas: ['Thrips','Purple Blotch','Downy Mildew','Fusarium Rot','Bulb Mites'],
  Mango:   ['Mango Leafhopper','Mango Tip Borer','Mealybugs','Anthracnose','Powdery Mildew'],
};

function sevInfo(pct) {
  const p = parseFloat(pct) || 0;
  if (p === 0) return { label:'Safe',          dot:'#22c55e', bg:'#dcfce7', text:'#166534', border:'#86efac' };
  if (p < 20)  return { label:'Low Risk',      dot:'#facc15', bg:'#fef9c3', text:'#854d0e', border:'#fde047' };
  if (p < 40)  return { label:'Moderate Risk', dot:'#f97316', bg:'#ffedd5', text:'#9a3412', border:'#fdba74' };
  return              { label:'High Risk',     dot:'#ef4444', bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' };
}

const BLANK = {
  date: new Date().toISOString().slice(0,10),
  farmerName:'', address:'', validator:'',
  latitude:'', longitude:'',
  crop:'Rice', variety:'', growthStage:'Vegetative', datePlanted:'',
  municipality:'Abra de Ilog', province:'Occidental Mindoro', barangay:'',
  areaPlanted:'', areaAffected:'', percentInfestation:'',
  pests:'', remarks:'',
};

export default function PestReportForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const editMode  = state?.editMode === true;
  const existing  = state?.record;

  const [form,    setForm]    = useState(editMode && existing ? { ...BLANK, ...existing } : BLANK);
  const [status,  setStatus]  = useState('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [gpsLoad, setGpsLoad] = useState(false);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const setProvince = e => {
    const prov = e.target.value;
    const mun = prov === 'Oriental Mindoro' ? ORIENTAL_MUNICIPALITIES[0]
      : prov === 'Occidental Mindoro' ? OCCIDENTAL_MUNICIPALITIES[0]
      : prov === 'Marinduque' ? MARINDUQUE_MUNICIPALITIES[0]
      : prov === 'Romblon' ? ROMBLON_MUNICIPALITIES[0]
      : prov === 'Palawan' ? PALAWAN_MUNICIPALITIES[0]
      : MUNICIPALITIES[prov][0];
    const clearBarangay =
      prov === 'Oriental Mindoro' ||
      prov === 'Occidental Mindoro' ||
      prov === 'Marinduque' ||
      prov === 'Romblon' ||
      prov === 'Palawan';
    setForm(p => ({ ...p, province: prov, municipality: mun, barangay: clearBarangay ? '' : p.barangay }));
  };

  const isOrientalMindoro = form.province === 'Oriental Mindoro';
  const isOccidentalMindoro = form.province === 'Occidental Mindoro';
  const isMarinduque = form.province === 'Marinduque';
  const isRomblon = form.province === 'Romblon';
  const isPalawan = form.province === 'Palawan';
  const hasBarangayMunicipalityList =
    isOrientalMindoro || isOccidentalMindoro || isMarinduque || isRomblon || isPalawan;
  const barangayMunicipalityList = isOrientalMindoro ? BARANGAY_MUNICIPALITY
    : isOccidentalMindoro ? BARANGAY_MUNICIPALITY_OCCIDENTAL
    : isMarinduque ? BARANGAY_MUNICIPALITY_MARINDUQUE
    : isRomblon ? BARANGAY_MUNICIPALITY_ROMBLON
    : isPalawan ? BARANGAY_MUNICIPALITY_PALAWAN
    : [];
  const municipalityOptions = isOrientalMindoro ? ORIENTAL_MUNICIPALITIES
    : isOccidentalMindoro ? OCCIDENTAL_MUNICIPALITIES
    : isMarinduque ? MARINDUQUE_MUNICIPALITIES
    : isRomblon ? ROMBLON_MUNICIPALITIES
    : isPalawan ? PALAWAN_MUNICIPALITIES
    : [];
  const filteredBarangays = hasBarangayMunicipalityList
    ? barangayMunicipalityList.filter(bm => !form.municipality || bm.municipality === form.municipality)
    : [];
  const setBarangayMunicipality = (barangay, municipality) => {
    setForm(p => ({ ...p, barangay, municipality }));
  };

  const getGPS = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({ ...p, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setGpsLoad(false);
      },
      () => { alert('Could not get location.'); setGpsLoad(false); }
    );
  };

  const sev = sevInfo(form.percentInfestation);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.farmerName || !form.crop || !form.percentInfestation) {
      setErrMsg('Please fill in all required fields.');
      setStatus('error'); return;
    }
    setStatus('loading');
    try {
      if (editMode && existing?.id) {
        const { id, createdAt, ...data } = { ...form };
        await updatePestReport(existing.id, data);
      } else {
        await addPestReport(form);
      }
      setStatus('success');
      setTimeout(() => navigate('/forms'), 1800);
    } catch {
      setErrMsg('Failed to save. Will sync when online.');
      setStatus('error');
    }
  };

  if (status === 'success') return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-8 gap-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background:'#E8F9FA' }}>
        <CheckCircle size={44} style={{ color:'#0D5C6A' }} />
      </div>
      <h2 className="text-xl font-bold text-gray-800">
        {editMode ? 'Record Updated!' : 'Report Submitted!'}
      </h2>
      <p className="text-sm text-gray-500 text-center">
        {editMode ? 'The pest report has been updated successfully.' : 'The pest report has been saved and will appear on the surveillance map.'}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-10 pb-4"
        style={{ background:'linear-gradient(135deg,#072F36,#0D5C6A)' }}>
        <button onClick={() => navigate('/forms')} className="p-2 rounded-xl" style={{ background:'rgba(255,255,255,0.12)' }}>
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'#80E8EA' }}>
            {editMode ? 'EDITING — Form 1' : 'Form 1'}
          </p>
          <h1 className="text-white font-bold text-base">Pest Report</h1>
        </div>
        {editMode && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background:'rgba(255,255,255,0.15)', color:'#AAECED' }}>
            EDIT MODE
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="screen-content px-4 pb-6 pt-4 space-y-4">
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{errMsg}</p>
          </div>
        )}

        <Section title="General Information">
          <F label="Date *"><input type="date" className="input-field" value={form.date} onChange={set('date')} /></F>
          <F label="Name of Farmer *"><input className="input-field" placeholder="Juan Dela Cruz" value={form.farmerName} onChange={set('farmerName')} /></F>
          <F label="Address"><input className="input-field" placeholder="Complete address" value={form.address} onChange={set('address')} /></F>
          <F label="Name of Validator"><input className="input-field" placeholder="DA/LGU Technician" value={form.validator} onChange={set('validator')} /></F>
        </Section>

        <Section title="Location Data">
          <div className="flex gap-2">
            <F label="Latitude *" cls="flex-1"><input className="input-field" placeholder="12.3688" value={form.latitude} onChange={set('latitude')} /></F>
            <F label="Longitude *" cls="flex-1"><input className="input-field" placeholder="121.9119" value={form.longitude} onChange={set('longitude')} /></F>
          </div>
          <button type="button" onClick={getGPS} disabled={gpsLoad}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ borderColor:'#129EAC', color:'#0D5C6A' }}>
            {gpsLoad ? <><Loader size={15} className="animate-spin" />Getting location…</>
                     : <><Crosshair size={15} />Auto-detect GPS Location</>}
          </button>
          <F label="Province">
            <select className="input-field" value={form.province} onChange={setProvince}>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Barangay">
              {hasBarangayMunicipalityList ? (
                <select
                  className="input-field"
                  value={form.barangay && form.municipality ? `${form.barangay}|${form.municipality}` : ''}
                  onChange={e => {
                    const v = e.target.value;
                    if (!v) return;
                    const [barangay, municipality] = v.split('|');
                    if (barangay && municipality) setBarangayMunicipality(barangay, municipality);
                  }}
                >
                  <option value="">Select barangay</option>
                  {filteredBarangays.map(bm => (
                    <option key={`${bm.barangay}-${bm.municipality}`} value={`${bm.barangay}|${bm.municipality}`}>{bm.barangay}</option>
                  ))}
                </select>
              ) : (
                <input className="input-field" placeholder="Barangay" value={form.barangay} onChange={set('barangay')} />
              )}
            </F>
            <F label="Municipality">
              {hasBarangayMunicipalityList ? (
                <select
                  className="input-field"
                  value={form.municipality}
                  onChange={e => {
                    const mun = e.target.value;
                    setForm(p => ({ ...p, municipality: mun, barangay: '' }));
                  }}
                >
                  {municipalityOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              ) : (
                <select className="input-field" value={form.municipality} onChange={set('municipality')}>
                  {(MUNICIPALITIES[form.province] || []).map(m => <option key={m}>{m}</option>)}
                </select>
              )}
            </F>
          </div>
        </Section>

        <Section title="Crop Details">
          <div className="grid grid-cols-2 gap-2">
            <F label="Crop *">
              <select className="input-field" value={form.crop} onChange={set('crop')}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </F>
            <F label="Variety"><input className="input-field" placeholder="NSIC RC222" value={form.variety} onChange={set('variety')} /></F>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Growth Stage">
              <select className="input-field" value={form.growthStage} onChange={set('growthStage')}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Date Planted"><input type="date" className="input-field" value={form.datePlanted} onChange={set('datePlanted')} /></F>
          </div>
        </Section>

        <Section title="Damage Assessment">
          <div className="grid grid-cols-2 gap-2">
            <F label="Area Planted (ha)"><input type="number" className="input-field" placeholder="0.00" step="0.01" value={form.areaPlanted} onChange={set('areaPlanted')} /></F>
            <F label="Area Affected (ha)"><input type="number" className="input-field" placeholder="0.00" step="0.01" value={form.areaAffected} onChange={set('areaAffected')} /></F>
          </div>
          <F label="% Infestation *">
            <input type="number" className="input-field" placeholder="0 – 100" min="0" max="100"
              value={form.percentInfestation} onChange={set('percentInfestation')} />
          </F>
          {form.percentInfestation !== '' && (
            <div className="flex items-center gap-2 border rounded-xl px-4 py-2.5"
              style={{ background: sev.bg, borderColor: sev.border }}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: sev.dot }} />
              <span className="text-sm font-bold" style={{ color: sev.text }}>{sev.label}</span>
              <span className="text-xs text-gray-500 ml-auto">{form.percentInfestation}% infestation</span>
            </div>
          )}
          <F label="Pests / Diseases">
            <select className="input-field" value={form.pests} onChange={set('pests')}>
              <option value="">Select pest/disease</option>
              {(PESTS_BY_CROP[form.crop]||[]).map(p => <option key={p}>{p}</option>)}
              <option value="Other">Other (specify in remarks)</option>
            </select>
          </F>
          <F label="Remarks">
            <textarea className="input-field resize-none" rows={3} placeholder="Additional observations…"
              value={form.remarks} onChange={set('remarks')} />
          </F>
        </Section>

        <button type="submit" disabled={status === 'loading'} className="btn-primary disabled:opacity-60">
          {status === 'loading'
            ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin" />Saving…</span>
            : editMode ? '💾 Update Pest Report' : '📍 Submit Pest Report'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide border-b pb-2"
        style={{ color:'#0D5C6A', borderColor:'#AAECED' }}>{title}</h3>
      {children}
    </div>
  );
}
function F({ label, children, cls = '' }) {
  return <div className={cls}><label className="form-label">{label}</label>{children}</div>;
}
