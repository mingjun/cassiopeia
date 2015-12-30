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
		menu.push(normalizeText(unencodeHtmlContent(n)));
	}
	
	var xhrInfoList = [];
	// sent out a bunch of query to translate all items in the menu.
	for(start = 0; start < menu.length; start = o.endIndex) {
		var o = buildQueryString(menu, start);
		xhrInfoList.push({
			params: o.params, 
			start: start,
			end: o.endIndex
		});
	}
	chainQuerys(xhrInfoList);
}

// avoid to be banned by google translate website, act more like human :)
// send out xhr query one after another.
function chainQuerys(xhrInfoList) {
	function step(index) {
		if(index >= xhrInfoList.length) {
			return;
		}
		var o = xhrInfoList[index];
		queryGoogleTranslation(o.params, o.start, o.end, 
			function() {
				updateMenu.apply({}, arguments);
				step(index + 1);
			}, 
			handleError);
	}
	step(0);
}

// build the query string for google translation
function buildQueryString(menu, start) {
	var defaultParams = 
		"client=t&sl=en&tl=zh-CN&hl=zh-CN&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&source=btn&ssel=0&tsel=0&kc=0";
	
	var buff = [];
	var len = defaultParams.length + 3;
	var endIndex;
	for(var i=start;i<menu.length;i++) {
		var m = escape(menu[i]);
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
	
	var str = buff.join("%0A");
	return {
		endIndex: endIndex,
		params: defaultParams + getCheckSumParameter(unescape(str)) + "&q=" +str
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
		var english = (pair[1] || "").trim();
		var original = normalizeText(unencodeHtmlContent(n));
		var chinese = (pair[0] || "").trim();
		
		if(original.trim() !== english) {
			continue;
		}
		n.innerHTML = "\
			<div class='mxx-i18n'>\
				<div class='mxx-en'>" + n.innerHTML + "</div>\
				<div class='mxx-cn'>" + chinese + "</div>\
			</div>";
	}
}

// there may be some HTML encoded chars e.g. &nbsp &lt 
// we don't want to translate them until decoded.
function unencodeHtmlContent(node) {
  var buff = [];
  var children = node.childNodes;
  // Chrome splits innerHTML into many child nodes, each one at most 65536.
  // Whereas FF creates just one single huge child node.
  for (var i = 0; i < children.length; ++i) {
    buff.push(children[i].nodeValue);
  }
  return buff.join("");
}

// some char is not needed to translate. remove them.
function normalizeText(str) {
	return str.replace(/\s+/g, " ");
}

//naiive handler
function handleError(key, moreInfo, more2) {
	console.log(key, moreInfo, more2);
}

// google API update, a CheckSum algorthm is used for string to translate
// example: <other_para>&tk=957625.572030&q=<str>
// this piece of code is mostly comming from https://translate.google.com/translate/releases/twsfe_w_20151214_RC03/r/js/desktop_module_main.js
// reference: https://github.com/soimort/translate-shell/issues/94 
function getCheckSumParameter(str) {

	var cb="&",k="",mf="=",Vb="+-a^+6",Ub="+-3^+b+-f",t="a",Tb="+",dd=".",
	QL=function(a){
			return function(){return a;}
	},
	RL=function(a,b){
		for(var c=0;c<b.length-2;c+=3){
			var d = b.charAt(c+2);
			d =  d>=t ?  d.charCodeAt(0)-87  :  Number(d);
			d =  b.charAt(c+1)==Tb  ?  a>>>d  :  a<<d;
			a =  b.charAt(c)==Tb  ? a+d&4294967295  :  a^d;
		}
		return a;
	},
	SL=null,
	TL=function(a) {
		var b;
		if (null  === SL) {
			//var c = QL(String.fromCharCode(84));
			//b = QL(String.fromCharCode(75));
			//c = [c(), c()];
			//c[1] = b();
			//SL = Number(window[c.join(b())]) || 0
			SL= Math.floor(Date.now()/1000/3600);
		}

		b = SL;
		var d = QL(String.fromCharCode(116))
		  , c = QL(String.fromCharCode(107))
		  , d = [d(), d()];
		d[1] = c();
		for (var c = cb + d.join(k) + mf, d = [], e = 0, f = 0; f < a.length; f++) {
			var g = a.charCodeAt(f);
			128 > g ? d[e++] = g : (2048 > g ? d[e++] = g >> 6 | 192 : (55296 == (g & 64512) && f + 1 < a.length && 56320 == (a.charCodeAt(f + 1) & 64512) ? (g = 65536 + ((g & 1023) << 10) + (a.charCodeAt(++f) & 1023),
			d[e++] = g >> 18 | 240,
			d[e++] = g >> 12 & 63 | 128) : d[e++] = g >> 12 | 224,
			d[e++] = g >> 6 & 63 | 128),
			d[e++] = g & 63 | 128)
		}
		a = b || 0;
		for (e = 0; e < d.length; e++)
			a += d[e],
			a = RL(a, Vb);
		a = RL(a, Ub);
		0 > a && (a = (a & 2147483647) + 2147483648);
		a %= 1E6;

		return c + (a.toString() + dd + (a ^ b))
	};

	return TL(str);
}