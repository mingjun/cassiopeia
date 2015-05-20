/**
	this is an enhancement to the casssiopeia menus
	check it before run to get food
**/

startEnhancement();

function $(cssSelector) {
	return document.querySelectorAll(cssSelector);
}

function startEnhancement(){
	var node = $("table[summary] td:nth-child(2)");
	var menu = [];
	
	// collection text in the item.
	for(var i=0;i<node.length; i++) {
		var n = node[i];
		menu.push(n.innerHTML);
	}
	
	// sent out a bunch of query to translate all items in the menu.
	for(start = 0; start < menu.length; start = o.endIndex) {
		var o = buildQueryString(menu, start);
		queryGoogleTranslation(o.params, start, o.endIndex, updateMenu, handleError);	
	}
}

// build the query string for google translation
function buildQueryString(menu, start) {
	var defaultParams = "client=t&sl=en&tl=zh-CN&hl=zh-CN&dt=bd&dt=ex\
		&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8\
		&oe=UTF-8&source=btn&ssel=0&tsel=0&kc=14&tk=521156|153327";
	
	var buff = [];
	var len = defaultParams.length + 3;
	var endIndex;
	for(var i=start;i<menu.length;i++) {
		var m = menu[i].replace(/ +/g, "%20");
		len += m.length + 3;
		// the URL length limit is 2048 byte.
		// other items will be translate in the next query
		if(len > 2000) { 
			endIndex = i; //mark how many items we have included, as the start of the next translation.
			break;
		}
		buff.push(m);
	}
	// in case "break" never happens in "for" statement
	if(!endIndex) {
		endIndex = i;
	}
	
	return {
		endIndex: endIndex,
		params: defaultParams + "&q=" + buff.join("%0A")
	};
}

// query the google tranlation web site, to get the chinese text
function queryGoogleTranslation(params, start, end, callback, errorback) {
	var baseURL = "https://translate.google.com/translate_a/single"
	var url = baseURL + "?" + params;
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if(xhr.status === 200) {
				var s = xhr.response;
				//remove holes in arrays, to fit JSON standard
				s = s.replace(/,+/g, ",");
				s = s.replace(/\[,/g, "[");
				s = s.replace(/,\]/g, ",]");
				
				try {
					var o = JSON.parse(s);
					if(o[0] && o[0].length > 0) {
						callback(o[0], start, end);
					} else {
						errorback("bad data1", xhr.response);
					}
				} catch(e) {
					errorback("bad data2", xhr.response, e);
				}
			} else {
				errorback("xhr error", url);
			}
		} 
	}
	xhr.send();
}
// append chinese translation after the each menu item. 
function updateMenu(trans, start, end) {
	var node = $("table[summary] td:nth-child(2)");
	for(var i=start;i<end; i++) {
		var n = node[i];
		var pair = trans[i - start]; // trans array index start from 0
		// format of pair: ["chinese text", "original text"]
		n.innerHTML = "\
			<div class='mxx-i18n'>\
				<div class='mxx-en'>" + n.innerHTML + "</div>\
				<div class='mxx-cn'>" + pair[0] + "</div>\
			</div>";
	}
}

//naiive handler
function handleError(key, moreInfo, more2) {
	console.log(key, moreInfo, more2);
}
