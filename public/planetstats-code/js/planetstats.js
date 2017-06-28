//https://census.daybreakgames.com/s:dgc/json/get/ps2:v2/character/?&c:limit=15&c:sort=name.first_lower&name.first_lower=^hawkeyes19&c:show=name.first,character_id,faction_id,battle_rank.value&c:resolve=world
		(function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(d.href.indexOf("http")||~d.href.indexOf(e.host))&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone")

		var api_ver;
		var api_switch;
		api_switch = '';
		prev_id = '';

		$(document).ready(function(){
			// // console.log('Open');

			var window_width = $(document).width();
			var window_height = $(document).height();

			if (window_width < window_height){
				$('body').css('font-size','');
			}

			$('html').css('background-image', 'url(css/ps2_3.jpg)');
			$( ".draggable" ).draggable();

			time = Math.round(+new Date()/1000);
			srch_faction = '';
			asc = 0;
			prev_s = 'rank';
			birthday = 0;
			api_ver	= 'ps2:v2';

			$('.logintime').text(time);

			$('.collapse').each(function(){
				var id = $(this).attr("id");
				$(this).before('<div class="title bold"><a href="javascript:void(0)" onClick="moreStats(\''+id+'\');" class="link">More Stats</a></div>');
			});

			$('.collapse').hide();

			$('.data').each(function(){
				if ($(this).hasClass('no-border')){
					//do nothing
				} else {
					$(this).after('<div class="clear"></div>');
				}
			});

			var player_str = '';

			$('#loginform').submit(function(e){

				e.preventDefault();
				ids = $('#login').val();
				ids = ids.replace(', ',',').replace(' ','');
				window.location.href = '/'+ids;


			});

			$(document).keypress(function(e){

				if ($('#newplayer').css("display") != "none" && e.which == 13) {

					var curr_chars = window.location.href.split('/')[3]+',';
					var new_chars = curr_chars+$('#newplayer').val().replace(', ', ',').replace(' ',',');
					window.location.href = '/'+new_chars;

				}

			});

			if (typeof window.location.href.split('/')[4] != 'undefined'){
				var url = window.location.href.split('/')[4];
			} else {
				var url = window.location.href.split('/')[3];
			}

			url = url.replace('?utm_content=buffer2e55e&utm_medium=social&utm_source=facebook.com&utm_campaign=buffer','');

			var url_chk = url.split(',')[0];
			// // console.log('Selecting Page');
			if (url.match(/^weapons$/)){
				getWeaponList();
			} else if (url.match(/^thankyou\.php$/)){

				$('body').load('thankyou.php');

			} else if (url.match(/\[/)){
				url = url.replace('[','').replace(']','').toLowerCase();
				getOutfit(url);

			} else  if (url_chk){
				if (parseInt(url_chk) == url_chk){
					// // console.log('Getting Weapon');
					getWeapon(url);
				} else {
					// // console.log('Getting Characters');

					if (typeof window.location.href.split('/')[4] != 'undefined'){
						var id = window.location.href.split('/')[4];
					} else {
						var id = window.location.href.split('/')[3];
					}

					// console.log(id);
					id = id.split('?')[0];
					id = id.replace(' ','').toLowerCase();

					id = id.replace('#','');
				//	// // console.log(id);
					id = id.split(',');

					var api_url = window.location.href.split('/')[2].split('.')[0];

					if (api_url == 'ps4'){


						var url = "http://census.daybreakgames.com/s:leigh103/get/ps2ps4us/character/?name.first_lower="+id[0]+"&c:show=character_id,name.first_lower";
						url = url+"&callback=?";
						// console.log(url);
						$.getJSON(url, function(data){

							if (data.character_list.length > 0){
								api_ver = 'ps2ps4us';
								// console.log('US');
								getChars('url');
							} else {

								var url2 = "http://census.daybreakgames.com/s:leigh103/get/ps2ps4eu/character/?name.first_lower="+id[0]+"&c:show=character_id,name.first_lower";
								url2 = url2+"&callback=?";
								$.getJSON(url2, function(data2){
									if (data2.character_list.length > 0){
										api_ver = 'ps2ps4eu';
										// console.log('EU');
										getChars('url');
									}
								});
							}
						});

					} else if (api_url == 'ps4eu'){

						api_ver = 'ps2ps4eu';
						getChars('url');

					} else if (api_url == 'ps4us'){

						api_ver = 'ps2ps4us';
						getChars('url');

					} else if (api_url == 'pc'){

						api_ver = 'ps2:v2';
						getChars('url');

					} else {

						api_ver = 'ps2:v2';
						getChars('url');

					}

					setTimeout(connectWebsocket(),3000);
				}
			}

			$('#search').keyup(function(e){

				var srch = $('#search').val().toLowerCase();
				searchCards(srch);

			});



		});

		function ucfirst(str){
			return (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
				return $1.toUpperCase();
			});
		}

		function sortNumber(a,b) {
			return a - b;
		}

		// Everything below is the same as using standard WebSocket.
		var ws;

		function connectWebsocket() {

			// Connect to Web Socket.
			var url = "wss://push.planetside2.com/streaming?service-id=s:leigh103";
			ws = new WebSocket(url);

			// Set event handlers.
			ws.onopen = function() {

				output("onopen");
				onSubmit();

			};

			ws.onmessage = function(e) {

				// e.data contains received string.
				output("RECEIVED: " + e.data);

				var obj = jQuery.parseJSON(e.data);

				if(obj.payload){

					var id = obj.payload.character_id;

					var event = obj.payload.event_name;

					// Deaths
					var attacker_id = obj.payload.attacker_character_id;
					var weapon_id = obj.payload.attacker_weapon_id;

					// Faciity Control
					var facility_id = obj.payload.facility_id;
					var duration_held = obj.payload.duration_held;

					// Items
					var item_id = obj.payload.item_id;

					// skill
					var skill_id = obj.payload.skill_id;

					// BR
					var br = obj.payload.battle_rank;

					// Vehicle destroy
					var vehicle_id = obj.payload.vehicle_id;

					if (event == 'PlayerLogin'){

						$('#st-'+id).html('<font color="#2DDB24">ONLINE</font>');

						time_now_int = Math.round(+new Date()/1000);
						time_now = timeConverter(time_now_int);

						$('#login-session').text(time_now);

						getSessionStats(id, time_now_int);


					}

					if (event == 'PlayerLogout'){

						$('#st-'+id).html('Offline');
						if ($('.stat-card').length > 9){
							$('#name-first-'+id).css('color','#69E4E4');
						}

					}

					if (event == 'Death'){

						if ($('#'+id).length){

							var originalColor = $('#'+id).css('border-color');

					//		if ($('#deaths-'+id).length){
					//			var curr_deaths = parseInt($('#deaths-session-'+id).text());
					//			var curr_kills = parseInt($('#kills-session-'+id).text());
					//		//	$('#killstreaktemp-'+id).text('0');
					//			curr_deaths++;
					//
					//			if(curr_kills > 0){
					//				var curr_kd = curr_kills/curr_deaths;
					//				curr_kd = curr_kd.toFixed(2);
					//			}
					//
					//			if (curr_kd > 0){
					//				var at_ktd = parseInt($('#month-ktd-'+id).text());
					//				var perf = ((curr_kd-at_ktd)/at_ktd)*100;
					//				perf = perf.toFixed(1);
					//				$('#perf-session-'+attacker_id).text(perf);
					//			}
					//
					//			$('#deaths-session-'+id).text(curr_deaths);
					//			$('#ktd-session-'+id).text(curr_kd);
					//		}
					//
					//		time = Math.round(+new Date()/1000);

					//		var duration = getTimeFromSecs(time - parseInt(login_session));
					//		var curr_score = $('#score-session-'+attacker_id).text();

					//		$('#duration-session-'+id).text(duration);
					//		var curr_spm = parseInt(curr_score)/(time - parseInt(login_session));
					//		$('#spm-session-'+id).text(curr_spm.toFixed(2));

							$('#'+id).css('border-color', '#c40000');

							setTimeout(function(){
								$('#'+id).animate({'border-color': '#56BABA'},5000);
							},5000);



							setTimeout(function(){
								getKillBoard(id, 'update', 'DEATH');
								var login_session = $('#login-session-int-'+id).text();
								getSessionStats(id, login_session);
							},500);

							if ($('.stat-card').length > 9){

								$('#name-first-'+id).removeClass('green');
								$('#name-first-'+id).removeClass('blue');
								$('#name-first-'+id).css('color','#c40000');
								$('#name-first-'+id).animate({'color':'#2DDB24'},1000);
							}

							updateAch(id);
						//	resolveIDs(id);


						} else {

							var originalColor = $('#'+attacker_id).css('border-color');

						//	if ($('#kills-'+attacker_id).length){
						//		var curr_deaths = parseInt($('#deaths-session-'+attacker_id).text());
						//		var curr_kills = parseInt($('#kills-session-'+attacker_id).text());
						//		var killstreak = parseInt($('#killstreak-session-'+attacker_id).text());
						//		var killstreak_temp = parseInt($('#killstreaktemp-'+attacker_id).text());
						//		curr_kills++;
						//		killstreak_temp++;
						//
						//		$('#killstreaktemp-'+attacker_id).text(killstreak_temp);
						//
						//		if (killstreak < killstreak_temp){
						//			$('#killstreak-session-'+attacker_id).text(killstreak_temp);
						//		}
						//
						//		if(curr_deaths > 0){
						//			var curr_kd = curr_kills/curr_deaths;
						//			curr_kd = curr_kd.toFixed(2);
						//		}
						//
						//		if (curr_kd > 0){
						//			var at_ktd = parseInt($('#month-ktd-'+attacker_id).text());
						//			var perf = ((curr_kd-at_ktd)/at_ktd)*100;
						//			perf = perf.toFixed(1);
						//
						//			if (perf > 0){
						//				perf_direction = '% Improvement';
						//			} else {
						//				perf = Math.abs(perf);
						//				perf_direction = '% Decline';
						//
						//			}
						//
						//			$('#perf-session-'+attacker_id).text(perf+' '+perf_direction);
						//		}
						//
						//		$('#kills-session-'+attacker_id).text(curr_kills);
						//		$('#ktd-session-'+attacker_id).text(curr_kd);

						//		var curr_score = parseInt($('#score-session-'+attacker_id).text());
						//		curr_score = curr_score+130;
						//		$('#score-session-'+attacker_id).text(curr_score);

						//		time = Math.round(+new Date()/1000);

						//		var duration_int = time - parseInt(login_session);
						//		var duration = getTimeFromSecs(duration_int);

							//	// // console.log(duration_int+' '+login_session);

						//		$('#duration-session-'+attacker_id).text(duration);
						//		var curr_spm = curr_score/(duration_int/60);
						//		$('#spm-session-'+attacker_id).text(curr_spm.toFixed(2));



						//	}

							$('#'+attacker_id).css('border-color', '#ffffff');

							if ($('.stat-card').length > 9){

								$('#name-first-'+attacker_id).removeClass('green');
								$('#name-first-'+attacker_id).removeClass('blue');
								$('#name-first-'+attacker_id).css('color','#fff');
								$('#name-first-'+attacker_id).animate({'color':'#2DDB24'},1000);
							}

							setTimeout(function(){
								$('#'+attacker_id).animate({'border-color': originalColor},5000);
							},5000);



							setTimeout(function(){
								getKillBoard(attacker_id, 'update', 'KILL');
								var login_session = $('#login-session-int-'+attacker_id).text();
								getSessionStats(attacker_id, login_session);
							},1000);

							resolveIDs(id);


						}

					}

					if (event == 'ItemAdded'){

					//	$('#st-'+id).html(item_id+' added');
						$('#st-'+id).html(query('item',item_id)+' added');

					}

					if (event == 'FacilityControl'){

						$('#st-'+id).html(facility_id+' held for '+duration_held);

					}

					if (event == 'BattleRankUp'){

						$('#st-'+id).html('Ranked Up! BR'+br);

					}

					if (event == 'SkillAdded'){

					//	$('#st-'+id).html(item_id+' added');
						$('#st-'+id).html(query('skill',skill_id)+' added');

					}

					if (event == 'VehicleDestroy'){

						setTimeout(function(){
							getKillBoard(id, 'update', 'VEHICLE_DESTROY');
						},1500);
						var curr_veh = parseInt($('#veh-'+attacker_id).text());
						curr_veh++;
						$('#veh-'+attacker_id).text(curr_veh);

						var curr_score = parseInt($('#score-session-'+attacker_id).text());
						curr_score = curr_score+550;
						$('#score-session-'+attacker_id).text(curr_score);


					}

				}
			//	});



			};

			ws.onclose = function() {

				output("onclose");
				$('#start_button').text('.x.');
			};

			ws.onerror = function() {

				output("onerror");
				$('#start_button').text('---');

			};



		}



		function moreStats(div){
			$('#'+div).toggle();
			div = div.replace('more-', '');
			$('#screen-'+div).toggle();
			$('#screenshot-all').toggle();
		}

		function onSubmit(ids) {

			var ids = '';

			$('.content').each(function(){
				ids = ids+','+$(this).attr('id');
			});

			ids = ids.substring(1).replace(',add','');

			var input = '{"service":"event","action":"subscribe","characters":['+ids+'],"eventNames":["Death","PlayerLogin","PlayerLogout","VehicleDestroy","ItemAdded","BattleRankUp","FacilityControl","SkillAdded"]}';
			$('#start_button').text('.');
			// You can send message to the Web Socket using ws.send.
			ws.send(input);
			output("SENT: " + input);
			input = "";

		}

		function onCloseClick() {

			ws.close();

		}

		function query(type,id){

			if (type == 'name'){

				var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/character/?character_id="+id+"&c:show=character_id,name.first";
				url = url+"&callback=?";

				$.getJSON(url, function(data){
					return data.character_list[0].name.first;
				});

			}

			if (type == 'item'){

				var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/item/?item_id="+id+"&c:show=name.en";
				url = url+"&callback=?";

				$.getJSON(url, function(data){
					return data.item_list[0].name.en;
				});

			}

			if (type == 'skill'){

				var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/skill/?skill_id="+id+"&c:show=name.en";
				url = url+"&callback=?";

				$.getJSON(url, function(data){
					return data.skill_list[0].name.en;
				});

			}


		}

		function showKB(id,div,update){

		//	var check = $('#'+div).text();
		//	alert(check);
			if (update == 'show'){
				$('#'+div).toggle();
				$('#'+div).html('<img src="css/loader.gif" class="loader">');
				$.get('planetside_lookup.php?kd=killdeath&id='+id, function(data, status, xhr){

					$('#'+div).html(data);
					if (status == "error") {
						var msg = "Sorry but there was an error: ";
						$("#error").html(msg + xhr.status + " " + xhr.statusText);
					}

				});
			} else if (update == 'update'){

				$.get('planetside_lookup.php?kd=killdeath&id='+id, function(data, status, xhr){

					$('#'+div).html(data);
					if (status == "error") {
						var msg = "Sorry but there was an error: ";
						$("#error").html(msg + xhr.status + " " + xhr.statusText);
					}

				});
			} else {
				$('#'+div).toggle();
			}

		}

		function showAch(id){

			$('#ach-'+id).html('<img src="css/loader.gif" class="loader">');
			$('#ach-'+id).toggle();
			var url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event/?character_id='+id+'&c:limit=30&type=ACHIEVEMENT&c:join=achievement^on:achievement_id^to:achievement_id^inject_at:achievement_id&callback=?';

			$.getJSON(url, function(data){
				$('#ach-'+id).html('');
				$.each(data.characters_event_list, function(key, val){

					var time = timeConverter(data.characters_event_list[key].timestamp);
					$('#ach-'+id).append('<div class="kb-item kill"><div class="timestamp">'+time+'</div><img src="http://census.daybreakgames.com'+data.characters_event_list[key].achievement_id.image_path+'" class="ach-icon"><span class="blue">'+data.characters_event_list[key].achievement_id.name.en+'</span><br>'+data.characters_event_list[key].achievement_id.description.en+'</div>');

				});

			});


		}

		function updateAch(id){

		//	$('#ach-'+id).html('');
		//	$('#ach-'+id).toggle();
			var url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event/?character_id='+id+'&c:limit=1&type=ACHIEVEMENT&c:join=achievement^on:achievement_id^to:achievement_id^inject_at:achievement_id&callback=?';

			$.getJSON(url, function(data){

				$.each(data.characters_event_list, function(key, val){

					var time = timeConverter(data.characters_event_list[key].timestamp);
					$('#ach-'+id).prepend('<div class="kb-item kill"><div class="timestamp">'+time+'</div><img src="http://census.daybreakgames.com'+data.characters_event_list[key].achievement_id.image_path+'" class="ach-icon"><span class="blue">'+data.characters_event_list[key].achievement_id.name.en+'</span><br>'+data.characters_event_list[key].achievement_id.description.en+'</div>');

				});

			});


		}

		function showSession(id){
		//	var login = parseInt($('#login-session-int-'+id).text());
		//	getSessionStats(id, login);
			$('#last-session-'+id).toggle();
		}

		function logout() {

			setCookie('players', '', 1);
			window.location.href = '/';

		}

		function setTz(tz){
			setCookie('tz', tz, 360);

			if (tz == 'Europe/London'){$('#eu').css('color','#fff');$('#us').css('color','');$('#au').css('color','');}
			if (tz == 'America/Denver'){$('#eu').css('color','');$('#us').css('color','#fff');$('#au').css('color','');}
			if (tz == 'Asia/Singapore'){$('#eu').css('color','');$('#us').css('color','');$('#au').css('color','#fff');}
		}

		function show(div){
			$('#'+div).toggle();
		}

		function searchCards(srch){

			$('.header').slideUp(2000);
			srch = srch.toLowerCase();
			$('.link').css('color', '');

			if (srch.match(/terran/gi)){
				srch_faction = 'terran';
			} else if (srch.match(/conglomerate/gi)){
				srch_faction = 'conglomerate';
			} else if (srch.match(/sovereignty/gi)){
				srch_faction = 'sovereignty';
			} else if (srch.match(/nanite/gi)){
				srch_faction = 'nanite';
			} else if (srch.match(/all/gi)){
				$('#all').css('color', '#fff');
				srch_faction = 'all';
				showAll();
				return;
			}

			$('#'+srch_faction).css('color', '#fff');

			if (srch_faction == 'all'){
				srch_faction = '';
			}

			if (srch.match(/\+/gi)){
				srch = srch.split('+');
				var add = 1;
			} else {
				srch = srch.split('|');
				var add = 0;
			}

			$('.stat-card').each(function(){
				var val = $(this).find('td').text();
				val = val.toLowerCase();

				if (srch_faction != ''){

					if (srch.length > 1 && add == 1){

						if (val.match(srch[0]) && val.match(srch[1]) && val.match(srch_faction)){
							$(this).show();
						} else {
							$(this).hide();
						}

					} else if (srch.length > 1 && add == 0){

						if (val.match(srch[0]) && val.match(srch_faction) || val.match(srch[1]) && val.match(srch_faction)){
							$(this).show();
						} else {
							$(this).hide();
						}

					} else {

						if (val.match(srch) && val.match(srch_faction)){
							$(this).show();
						} else {
							$(this).hide();
						}

					}

				} else {

					if (srch.length > 1 && add == 1){

						if (val.match(srch[0]) && val.match(srch[1])){
							$(this).show();
						} else {
							$(this).hide();
						}

					} else if (srch.length > 1 && add == 0){

						if (val.match(srch[0]) || val.match(srch[1])){
							$(this).show();
						} else {
							$(this).hide();
						}

					} else {

						if (val.match(srch)){
							$(this).show();
						} else {
							$(this).hide();
						}

					}

				}
			});
			alphaSort('type');
		}

		function numSort(s){

			setCookie('sort',s,360);
			var number = [];
			var online = {};
			var i = 0;
			var val_max = 0;
			var val_min = 9999999999;

			$('.stat-card').each(function(){
				var numArr = [];
				var div_sort = $('.sort-'+s, this).text().replace(/\%/g,'');

				var id = $(this).attr('id');

				if (div_sort == '-'){

					div_sort = 1;

				} else if (typeof div_sort != 'undefined'){

					div_sort = parseFloat(div_sort);
					div_sort = div_sort*1000;

				} else {

					div_sort = 99;

				}

				for (var ii=0; ii<$('.stat-card').length;ii++){

					if (number[div_sort] != null){
						div_sort++
					};

				}

				number[div_sort] = $(this);
				online[div_sort] = $('#st-'+id).text();

				if (val_max < div_sort){
					val_max = div_sort;
				}

				if (val_min > div_sort){
					val_min = div_sort;
				}

				val_min=0;
				i++;

			});

			$('.stat-card').remove();

			if (prev_s == s && asc == 1){
				asc = 0;
				prev_s = s;
			} else if (prev_s != s && asc == 1) {
				asc = 1;
				prev_s = s;
			} else if (prev_s == s && asc == 0) {
				asc = 1;
				prev_s = s;
			} else if (prev_s != s && asc == 0) {
				asc = 1;
				prev_s = s;
			}



			for (v=0;v<=1;v++){
				if (asc == 1){
					for(var iv=val_max; iv >= val_min; iv--){
						if (number[iv] != null){
							if (online[iv] != 'Offline' && v == 0){ // first iteration and online
								$('.content-wrap').append(number[iv]);
							} else if (online[iv] == 'Offline' && v == 1){ // second iteration and offline
								$('.content-wrap').append(number[iv]);
							}
						}
					}
				} else {
					for(var iv=val_min; iv <= val_max; iv++){
						if (number[iv] != null){
							if (online[iv] != 'Offline' && v == 0){ // first iteration and online
								$('.content-wrap').append(number[iv]);
							} else if (online[iv] == 'Offline' && v == 1){ // second iteration and offline
								$('.content-wrap').append(number[iv]);
							}
						}
					}
				}
			}

		}

		function numSortTable(s){

			$('td.outfit-table-title.'+s).html('<img src="css/loader.gif" class="loader">');


			setTimeout(function(){
				setCookie('sort',s,360);
				var number = [];
				var online = {};
				var i = 0;
				var val_max = 0;
				var val_min = 9999999999;

				$('.stat-card').each(function(){
					var numArr = [];
					var div_sort = $('td.sort-'+s, this).text().replace(/\%/g,'');

					var id = $(this).attr('id');

					if (div_sort == '-'){

						div_sort = 1;

					} else if (typeof div_sort != 'undefined'){

						parseInt(div_sort);
						div_sort = div_sort*100;

					} else {

						div_sort = 99;

					}

					for (var ii=0; ii<$('.stat-card').length;ii++){

						if (number[div_sort] != null){
							div_sort++
						};

					}

					number[div_sort] = $(this);
					online[div_sort] = $('#st-'+id).text();

					if (val_max < div_sort){
						val_max = div_sort;
					}

					if (val_min > div_sort){
						val_min = div_sort;
					}

					//val_min=0;
					i++;

				});

				$('.stat-card').remove();

				if (prev_s == s && asc == 1){
					asc = 0;
					prev_s = s;
				} else if (prev_s != s && asc == 1) {
					asc = 1;
					prev_s = s;
				} else if (prev_s == s && asc == 0) {
					asc = 1;
					prev_s = s;
				} else if (prev_s != s && asc == 0) {
					asc = 1;
					prev_s = s;
				}



				for (v=0;v<=1;v++){
					if (asc == 1){
						for(var iv=val_max; iv >= val_min; iv--){
							if (number[iv] != null){
								if (online[iv] != 'Offline' && v == 0){ // first iteration and online
									$('#sort-append').append(number[iv]);
								} else if (online[iv] == 'Offline' && v == 1){ // second iteration and offline
									$('#sort-append').append(number[iv]);
								}
							}
						}
					} else {
						for(var iv=val_min; iv <= val_max; iv++){
							if (number[iv] != null){
								if (online[iv] != 'Offline' && v == 0){ // first iteration and online
									$('#sort-append').append(number[iv]);
								} else if (online[iv] == 'Offline' && v == 1){ // second iteration and offline
									$('#sort-append').append(number[iv]);
								}
							}
						}
					}
				}

				var s_parse = s.replace('_',' ');
				s_parse = ucfirst(s_parse);

				$('td.outfit-table-title.'+s).text(s_parse);
			}, 500);



		}

		function alphaSort(s){

			var alpha = [];

			$('.stat-card').each(function(){

				var alphaArr = [];

				var div_sort = $('.sort-'+s, this).text();

				alphaArr.push(div_sort);
				alphaArr.push($(this));
				alpha.push(alphaArr);

				$(this).remove();

			});

			if (asc == 1){
				alpha.sort();
				alpha.reverse();
				alpha.sort();
				asc = 0;
			} else if (asc == 0){
				alpha.sort();
				alpha.reverse();
				asc = 1;
			}

			for(var i=0; i<alpha.length; i++){
				$('#outfit-list').append(alpha[i][1]);
			}

			var srch = $('#search').val();

			if (srch != ''){
				srch = srch.split('+');

				$('.stat-card').each(function(){
					var val = $(this).find('td').text();
					val = val.toLowerCase();
					if (srch.length > 1){
						if (val.match(srch[0]) && val.match(srch[1])){
							$(this).show();
						} else {
							$(this).hide();
						}
					} else {
						if (val.match(srch)){
							$(this).show();
						} else {
							$(this).hide();
						}
					}
				});
			}

		}

		function alphaSortTable(s){

			var alpha = [];
			numeric = 0;
			$('.stat-card').each(function(){

				var alphaArr = [];

				var div_sort = $('td.sort-'+s, this).text();

				div_sort = div_sort.replace('%','').replace(/h\s[0-9][0-9]m/,'');

				if ($.isNumeric(div_sort)){
					div_sort = parseFloat(div_sort);
					div_sort = div_sort*100;
				//	// // console.log(div_sort);
					numeric = 1;
				}

				alphaArr.push(div_sort);
				alphaArr.push($(this));
				alpha.push(alphaArr);

				$(this).remove();

			});

			if (prev_s == s && asc == 1){
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
					alpha.sort();
				}
				asc = 0;
				prev_s = s;
			} else if (prev_s != s && asc == 1) {
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
				}
				asc = 1;
				prev_s = s;
			} else if (prev_s == s && asc == 0) {
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
				}
				asc = 1;
				prev_s = s;
			} else if (prev_s != s && asc == 0) {
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
				}
				asc = 1;
				prev_s = s;
			}

		//	if (asc == 1){
		//		if (numeric == 1){
		//			alpha.sort((function(index){
		//				return function(a, b){
		//					return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
		//				};
		//			})(0));
		//		} else {
		//			alpha.sort();
		//			alpha.reverse();
		//			alpha.sort();
		//		}
		//		asc = 0;
		//	} else if (asc == 0){
		//		if (numeric == 1){
		//			alpha.sort((function(index){
		//				return function(a, b){
		//					return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
		//				};
		//			})(0));
		//		} else {
		//			alpha.sort();
		//			alpha.reverse();
		//		}
		//		asc = 1;
		//	}

			for(var i=0; i<alpha.length; i++){
				$('#sort-append').append(alpha[i][1]);
			}

			var s_parse = s.replace('_',' ');
			s_parse = ucfirst(s_parse);

			$('td.'+s).text(s_parse);

		}

		function wstatSort(id, s, order){

			if (typeof order != 'undefined'){
				asc = order;
			}

			var alpha = [];
			$('#wstat-'+id+' .weapon').each(function(){

				var alphaArr = [];

				var div_sort = $('.'+s, this).text();

				div_sort = div_sort.replace('%','').replace(/h\s[0-9][0-9]m/,'');

				if ($.isNumeric(div_sort)){
					div_sort = parseFloat(div_sort);
					div_sort = div_sort*100;

					numeric = 1;
				}

				alphaArr.push(div_sort);
				alphaArr.push($(this));
				alpha.push(alphaArr);

				$(this).remove();

			});

			if (prev_s == s && asc == 1){
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
					alpha.sort();
				}
				asc = 0;
				prev_s = s;
			} else if (prev_s != s && asc == 1) {
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
				}
				asc = 1;
				prev_s = s;
			} else if (prev_s == s && asc == 0) {
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
				}
				asc = 1;
				prev_s = s;
			} else if (prev_s != s && asc == 0) {
				if (numeric == 1){
					alpha.sort((function(index){
						return function(a, b){
							return (a[index] === b[index] ? 0 : (a[index] > b[index] ? -1 : 1));
						};
					})(0));
				} else {
					alpha.sort();
					alpha.reverse();
				}
				asc = 1;
				prev_s = s;
			}

			for(var i=0; i<alpha.length; i++){
				$('#wstat-'+id).append(alpha[i][1]);
			}

		}


		function newPlayer(){
			$('#newplayer').toggle();
		}

		function remPlayer(remp){
			var url = window.location.href.split('/')[3].toLowerCase();
			url = url.replace(remp, '').replace(' ','').replace(',,',',');
			if (url.substring(0,1) == ','){
				url = url.slice(1);
			}
			if (url.substring(url.length-1,url.length) == ','){
				url = url.slice(0, -1);
			}
			window.location.href = '/'+url;
		}

		function toggleStats(id){

			if ($('#stat-toggle-'+id).text() == '30 days'){
				$('#stat-toggle-'+id).text('7 days');
			} else {
				$('#stat-toggle-'+id).text('30 days');
			}
			$('#month-ktd-'+id).toggle();
			$('#week-ktd-'+id).toggle();
			$('#accuracy-week-'+id).toggle();
			$('#accuracy-month-'+id).toggle();
			$('#hsr-week-'+id).toggle();
			$('#hsr-month-'+id).toggle();
			$('#assists-week-'+id).toggle();
			$('#assists-month-'+id).toggle();
			$('#month-spm-'+id).toggle();
			$('#week-spm-'+id).toggle();
			$('#tp-month-'+id).toggle();
			$('#tp-week-'+id).toggle();
			$('#perf-'+id).toggle();
			$('#perf-week-'+id).toggle();

			$('#kills-month-'+id).toggle();
			$('#kills-week-'+id).toggle();
			$('#deaths-month-'+id).toggle();
			$('#deaths-week-'+id).toggle();
			$('#revives-month-'+id).toggle();
			$('#revives-week-'+id).toggle();
			$('#truekdr-month-'+id).toggle();
			$('#truekdr-week-'+id).toggle();
			$('#facility-cap-month-'+id).toggle();
			$('#facility-cap-week-'+id).toggle();
			$('#facility-def-month-'+id).toggle();
			$('#facility-def-week-'+id).toggle();
			$('#medals-month-'+id).toggle();
			$('#medals-week-'+id).toggle();
			$('#score-month-'+id).toggle();
			$('#score-week-'+id).toggle();
			$('#weaponscore-month-'+id).toggle();
			$('#weaponscore-week-'+id).toggle();
			$('#supportscore-month-'+id).toggle();
			$('#supportscore-week-'+id).toggle();
			$('#certs-earned-month-'+id).toggle();
			$('#certs-earned-week-'+id).toggle();


		}

		function tableToggle(type){

			$('#table-change a').each(function(){

				$(this).removeClass('text-white');
				if ($(this).attr('id') == type){
					$(this).addClass('text-white');
				}
			});

			$('.stat').each(function(){
				$(this).hide();
				if ($(this).hasClass(type)){
					$(this).css('display', 'inline-block');
				}
			});

		}

		function toggle(id){
			$('#'+id).toggle();
		}

		function toggleGraph(type){

			$('a#line-toggle-'+type).each(function(){
				if ($(this).hasClass('off')){
					$(this).removeClass('off').addClass('on');
				} else {
					$(this).removeClass('on').addClass('off');
				}
			});

			$('.line-kills').hide();
			$('.line-deaths').hide();
			$('.line-kdr').hide();
			$('.line-kdrmag').hide();

			$('.graph-max').each(function(){
				$(this).text($(this).attr('max'));
			});
			$('.graph-half').each(function(){
				$(this).text($(this).attr('max'));
			});

			if ($('a#line-toggle-kills').hasClass('on') && $('a#line-toggle-deaths').hasClass('on') && $('a#line-toggle-kdr').hasClass('on')){
				$('.line-kills').show();
				$('.line-deaths').show();
				$('.line-kdr').show();
			} else if ($('a#line-toggle-kills').hasClass('on') && $('a#line-toggle-deaths').hasClass('off') && $('a#line-toggle-kdr').hasClass('off')){
				$('.line-kills').show();
			} else if ($('a#line-toggle-kills').hasClass('off') && $('a#line-toggle-deaths').hasClass('on') && $('a#line-toggle-kdr').hasClass('off')){
				$('.line-deaths').show();
			} else if ($('a#line-toggle-kills').hasClass('off') && $('a#line-toggle-deaths').hasClass('off') && $('a#line-toggle-kdr').hasClass('on')){
				$('.line-kdrmag').show();
			//	// console.log($('#graph-max').attr('kdr'));
				$('.graph-max').each(function(){
					$(this).text($(this).attr('kdr'));
				});
				$('.graph-half').each(function(){
					$(this).text($(this).attr('kdr'));
				});
			} else if ($('a#line-toggle-kills').hasClass('off') && $('a#line-toggle-deaths').hasClass('on') && $('a#line-toggle-kdr').hasClass('on')){
				$('.line-deaths').show();
				$('.line-kdr').show();
			} else if ($('a#line-toggle-kills').hasClass('on') && $('a#line-toggle-deaths').hasClass('off') && $('a#line-toggle-kdr').hasClass('on')){
				$('.line-kills').show();
				$('.line-kdr').show();
			} else if ($('a#line-toggle-kills').hasClass('on') && $('a#line-toggle-deaths').hasClass('on') && $('a#line-toggle-kdr').hasClass('off')){
				$('.line-kills').show();
				$('.line-deaths').show();
			} else if ($('a#line-toggle-kills').hasClass('off') && $('a#line-toggle-deaths').hasClass('off') && $('a#line-toggle-kdr').hasClass('off')){

			}

		}

		function screenGrabber(div, char_name) {

			$('#img_name').val(char_name);

			$('.status').remove();

			if (div == 'content-wrap'){
				$('#content-wrap').append('<span class="link">http://PlanetStats.net</span><br>');
			} else {

				var html_new = $('#'+div).html().replace(/<br\s?\/?>/, '');
				var window_height = $(window).height()-10;
				$('#'+div).html(html_new);
				$('.stat-card').css({'max-height':window_height+'px','width':'405px','background':'#0F2E30'});

				$('.faction-icon').css({
					'height': '250px',
					'right': '-47px',
					'top': '-40px'
				});

				$('.rank-icon').css({
					'width': '75px'
				});

				$('.clear').each(function(){
					$(this).remove();
				});

				$('.title').css('padding-left','0');
				$('.link').parent('.title').remove();
				$('.link').remove();
				$('.progress_bar').remove();
				$('.progress_next').remove();
				$('.progress_wrap').remove();
				$('.statbar-wrap').remove();
				$('.downarrow').remove();
				$('.kdr-'+div).remove();
				$('.spm-'+div).remove();

				if ($('#last-session-'+div).is(":visible")){
					$('#sr-'+div).after('<br><div class="data small">Last Session</div>')
				}

				$('#'+div).append('<span class="link small">http://PlanetStats.net</span>');

				var br = $('#'+div+' .sort-br').text();
				var char_name = $('#'+div+' .sort-name').text();
				//$('#'+div+' .sort-br').remove();
				//$('#'+div+' .sort-name').html(char_name+'<span class="float-right">'+br+'</span>');

			}



			html2canvas([document.getElementById(div)], {
				logging: true,
				useCORS: true,
				onrendered: function (canvas) {

					img = canvas.toDataURL("image/jpg");

					// // console.log(img.length);
					// // console.log(img);

					//  window.location.href=img; // it will save locally

					$('#img_val').val(canvas.toDataURL("image/png"));


					//Submit the form manually

					document.getElementById("myForm").submit();

				}
			});

		}


		function output(str) {

			var log = $('#log').html();
			var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").replace(/>/, "&gt;").replace(/"/, "&quot;");
			$('#log').html(escaped+'<br>'+log);

		}

		function getDirectives(id){
		// // console.log('Get Directives');
			//var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/characters_directive_tier/?character_id="+id+"&c:join=raw_directive_tiers^on:directive_tier_id^to:tier^inject_at:directive_tier_id&c:limit=500";

			var url = "https://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/characters_directive_tier/?character_id="+id+"&c:limit=500";
			url = url+"&callback=?";
			var dp = 0;
			var tier_cnt = 0;

			$.getJSON(url, function(data){

				for (var iv = 0; iv < data.characters_directive_tier_list.length; iv++){


					if (data.characters_directive_tier_list[iv].directive_tier_id == 2){dp = dp+5;tier_cnt++;}
					if (data.characters_directive_tier_list[iv].directive_tier_id == 3){dp = dp+10;tier_cnt++;}
					if (data.characters_directive_tier_list[iv].directive_tier_id == 4){dp = dp+25;tier_cnt++;}
					if (data.characters_directive_tier_list[iv].directive_tier_id == 5){dp = dp+100;tier_cnt++;}

				}
				//// // console.log(tier_cnt);
				$('#directive-'+id).html(dp);
				var no_dir = 4060;
				var dir_stat = (tier_cnt/no_dir)*100;
				dir_stat = dir_stat.toFixed(0);
				$('#dir-stat-'+id).css({'width': '0%'});
				$('#dir-stat-'+id).animate({'width': dir_stat+'%'});
				$('#title-dir-'+id).attr('title', dir_stat+'% Completed');

			});

		}

		function getDirectivesData(id){

			$('#dir-'+id).toggle();
			var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/characters_directive/?character_id="+id+"&c:join=directive^on:directive_id^to:directive_id^inject_at:directive&c:join=directive_tier^on:directive_tier_id^to:directive_tier_id^inject_at:directive_tier_id&c:join=directive_tree^on:directive_tree_id^to:directive_tree_id^inject_at:directive_tree_id&c:limit=500";
			url = url+"&callback=?";

			var empty_chk = {};

			$.getJSON(url, function(data){



				for (var iv = 0; iv < data.characters_directive_list.length; iv++){

					var div_id_parse = data.characters_directive_list[iv].directive_tree_id.name.en.replace(/\s/g,'-');
					var dir_cat = data.characters_directive_list[iv].directive_tree_id.directive_tree_category_id;
					// // console.log(dir_cat);
					//if (data.characters_directive_list[iv].completion_time > 0 && $('#dir-'+id+' #'+div_id_parse).length < 1){
					if ($('#dir-'+id+'-'+dir_cat+' #'+div_id_parse).length < 1){

						$('#dir-'+id+'-'+dir_cat).append('<div id="'+div_id_parse+'" class="kb-item kill directives"><span class="blue bold dir">'+data.characters_directive_list[iv].directive_tree_id.name.en+'</span></div>');
					}

				}

				for (var iv = 0; iv < data.characters_directive_list.length; iv++){

			//		if (typeof data.characters_directive_list[iv].directive.description != 'undefined'){
			//			var dir_desc = data.characters_directive_list[iv].directive.description.en;
			//		} else {
			//			var dir_desc = 'No Description Available';
			//		}

			//		if (data.characters_directive_list[iv].completion_time > 0){
			//			var div_id_parse = data.characters_directive_list[iv].directive_tree_id.name.en.replace(/\s/g,'-');
			//			time = timeConverter(data.characters_directive_list[iv].completion_time);
					//	$('#dir-'+div_id_parse+'-'+id+'-'+data.characters_directive_list[iv].directive.directive_tier_id).append('<span class="blue bold">Tier '+data.characters_directive_list[iv].directive.directive_tier_id+'</span> <span>'+dir_desc+'</span><br>');

			//		} else {
			//			var div_id_parse = data.characters_directive_list[iv].directive_tree_id.name.en.replace(/\s/g,'-');
			//			time = timeConverter(data.characters_directive_list[iv].completion_time);
					//	$('#dir-'+div_id_parse+'-'+id+'-'+data.characters_directive_list[iv].directive.directive_tier_id).append('<span class="text-grey bold">Tier '+data.characters_directive_list[iv].directive.directive_tier_id+'</span> <span class="text-grey">'+dir_desc+'</span><br>');
			//		}

				//	$('#dir-links-'+div_id_parse+'-'+id+'-'+data.characters_directive_list[iv].directive.directive_tier_id).html('<a href="javascript:void(0)" class="link" onClick="tierToggle(\''+div_id_parse+'-'+id+'\', \''+data.characters_directive_list[iv].directive.directive_tier_id+'\');">Tier '+data.characters_directive_list[iv].directive.directive_tier_id+'</a>');
				//	$('#dir-'+id+'-'+dir_cat+' #'+div_id_parse).append('/');
				}

			});

		}

		function tierToggle(div, tier){

			for (var i=0; i < 5; i++){
				if (i != tier){
					$('#dir-'+div+'-'+i).hide();
					$('#dir-links-'+div+'-'+i).css({'color':''});
				}
			}
			$('#dir-'+div+'-'+tier).toggle();
			$('#dir-links-'+div+'-'+tier).css({'color':'#fff'});

		}

		function getLogin(id){

		//	if (typeof session == 'undefined'){
		//		session = 1;
		//	}
			// console.log('Get Login:'+api_ver);
			session_cnt = 0;
			session_end = {};

			url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/characters_event/?character_id="+id+"&c:limit=2000&type=DEATH,KILL,VEHICLE_DESTROY, ITEM, ACHIEVEMENT&callback=?";
			if ($('#st-'+id).text() == 'Offline'){
				var time_prev = 9999999999;
			} else {
				var time_prev = time;
			}
			var ii = 0;
			// console.log(time_prev);
			$.getJSON(url, function(data){

				for (var i=0;i<data.characters_event_list.length;i++){

					var time_chk = time_prev - parseInt(data.characters_event_list[i].timestamp);

					if (time_chk > 7200 && time_prev != 9999999999){

						if (i > 0){
							ii = i-1;
						}

						$('#login-session-'+id).text(timeConverter(data.characters_event_list[ii].timestamp));
						$('#login-session-int-'+id).text(data.characters_event_list[ii].timestamp);
						$('#duration-session-'+id).text('');


						if ($('#st-'+id).text() == 'Offline'){
							duration_int = parseInt(data.characters_event_list[0].timestamp) - parseInt(data.characters_event_list[ii].timestamp);
							duration = getTimeFromSecs(duration_int*60);
						} else {
							duration_int = time - parseInt(data.characters_event_list[ii].timestamp);
							duration = getTimeFromSecs(duration_int*60);
						}

						$('#duration-session-'+id).text(duration);
						$('#duration-session-int-'+id).text(duration_int);

					//	if (session_cnt == 0){
					//		session_end[session_cnt+1] = data.characters_event_list[0].timestamp;
					//	} else {
					//		session_end[session_cnt+1] = data.characters_event_list[i].timestamp;
					//	}

					//	// // console.log(session_end[session_cnt]+' '+session);

					//	if (session_cnt == session){

						getSessionStats(id, data.characters_event_list[ii].timestamp);
						return;

					//	}

					//	session_cnt++;
					}

					time_prev = data.characters_event_list[i].timestamp;

				}

			});

		}

		function getSessionStats(id, time){

			// console.log('Getting session stats for '+id+' from '+time);

			time = parseInt(time)-1000;

			url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/characters_event/?character_id="+id+"&c:limit=500&type=DEATH,KILL,VEHICLE_DESTROY&c:join=character^on:attacker_character_id^to:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:attacker&c:join=character^on:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:victim&c:join=item^on:attacker_weapon_id^to:item_id^show:name.en^inject_at:attacker.weapon&c:join=vehicle^on:attacker_vehicle_id^to:vehicle_id^show:name.en^inject_at:attacker.vehicle&c:join=vehicle^on:vehicle_definition_id^to:vehicle_id^show:name.en^inject_at:victim.vehicle&c:join=loadout^on:character_loadout_id^to:loadout_id^inject_at:victim_class&after="+time+"&callback=?";

			var deaths=0;
			var kills=0;
			var killstreak=0;
			var killstreak_temp=0;
			var vehicle_destroy=0;
			var vehicle_spawn=0;
			var time_prev = 0;
			var time_diff = 0;
			var max_kill = 0;
			var max_death = 0;
			var max_kdr = 0;
			var curr_kdr = 0;
			var max_life_time = 0;
			var max_life_timestamp = 0;
			var headshot = 0;
			var hsr = 0;
			var kph = 0;
			var veh_list = {};
			var weapon_hs = {};
			var weapon_list = {};
			var weapon_count = {};
			var graph_deaths = [time];
			var graph_kills = [time];

			$.getJSON(url, function(data){
				// // console.log('Looping through session stats');
				for (var i=0;i<data.characters_event_list.length-1;i++){
					if (data.characters_event_list[i].zone_id < 97){

					//	// // console.log(data.characters_event_list[i].character_id);

						if (typeof data.characters_event_list[i].victim != 'undefined' && typeof data.characters_event_list[i].victim.name != 'undefined'){
							victim_name = data.characters_event_list[i].victim.name.first;
							victim_faction = data.characters_event_list[i].victim.faction_id;
						} else {
							victim_name = 'n/a';
							victim_faction = '';
						}

						if (data.characters_event_list[i].table_type == 'deaths'){

							deaths++;
							killstreak_temp = 0;
							var event_ts = parseInt(data.characters_event_list[i].timestamp);
							time_diff = parseInt(time_prev) - event_ts ;

							if (time_diff > max_life_timestamp && time_diff  != data.characters_event_list[i].timestamp){
								max_life_timestamp = time_diff;
								max_life_time = getTimeFromSecs(time_diff*60);
							//	max_life_time = time_diff;
							}

							graph_deaths.push(event_ts);

							time_prev = data.characters_event_list[i].timestamp;

							if (typeof data.characters_event_list[i].victim_class != 'undefined'){
								if (data.characters_event_list[i].victim_class.code_name.match(/max/i)){
									max_death++;
								}
							}

						} else if (data.characters_event_list[i].table_type == 'kills' && data.characters_event_list[i].attacker.name.first != victim_name && data.characters_event_list[i].attacker.faction_id != victim_faction){

							kills++;
							killstreak_temp++;
							if (killstreak_temp > killstreak){
								killstreak = killstreak_temp;
							}

							var event_ts = parseInt(data.characters_event_list[i].timestamp);
							graph_kills.push(event_ts);

							if (typeof data.characters_event_list[i].victim_class != 'undefined'){
								if (data.characters_event_list[i].victim_class.code_name.match(/max/i)){
									max_kill++;
								}
							}

							if (typeof data.characters_event_list[i].attacker.weapon == 'undefined'){
								var weapon = 'Unknown';
							} else {
								var weapon = data.characters_event_list[i].attacker.weapon.name.en;
							}

						//	var weapon = data.characters_event_list[i].attacker.weapon.name.en;
							var weapon_parse = weapon.replace(/\s/gi, '_').replace('.','').replace('(','').replace(')','');

							weapon_list[weapon_parse] = weapon;

							if (!weapon_hs[weapon_parse]){
								weapon_hs[weapon_parse] = 0;
							}

							if (data.characters_event_list[i].is_headshot == 1){
								headshot++;
								weapon_hs[weapon_parse] = weapon_hs[weapon_parse]+1;
							}


							if (!weapon_count[weapon_parse]){
								weapon_count[weapon_parse] = 0;
							}

							weapon_count[weapon_parse] = weapon_count[weapon_parse]+1;


						} else if (data.characters_event_list[i].table_type == 'vehicle_destroy' && data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].character_id != id) {

							vehicle_destroy++;

							if (typeof data.characters_event_list[i].victim.vehicle == 'undefined'){
								var veh = 'Unknown';
							} else {
								var veh = data.characters_event_list[i].victim.vehicle.name.en;
							}

							if (!veh_list[veh]){
								veh_list[veh] = 0;
							}

							veh_list[veh] = veh_list[veh]+1;


						} else if (data.characters_event_list[i].table_type == 'vehicle_destroy' && data.characters_event_list[i].character_id == id) {

							vehicle_spawn++;

						}

					}


				}
				// // console.log('Parsing and printing');
				kd = kills/deaths
				kd = kd.toFixed(2);
				if (isNaN(kd)){
					kd = 0;
				}
				$('#deaths-session-'+id).text(deaths);

				if (max_kill > 0){

					$('#kills-max-'+id).text(max_kill);

				}

				if (max_death > 0){

					$('#deaths-max-'+id).text(max_death);

				}

				$('#kills-session-'+id).text(kills);
				hsr = (headshot/kills)*100;
				$('#hsr-session-'+id).text(hsr.toFixed(2)+'%');
				$('#killstreak-session-'+id).text(killstreak);
				$('#ktd-session-'+id).text(kd);
				$('#max-life-session-'+id).text(max_life_time);

				var session_start = parseInt($('#login-session-int-'+id).text());
				var session_score = $('#score-session-'+id).text();
				var duration_int = parseInt($('#duration-session-int-'+id).text());
				var curr_spm = session_score/(duration_int/60);
				$('#spm-session-'+id).text(curr_spm.toFixed(2));

				(kills > 0 ? kph = kills/((duration_int/60)/60) : kph = 0);
				kph = kph.toFixed(2);
				$('#kph-session-'+id).text(kph);

				(kills > 0 ? kph = kills/(duration_int/60) : kph = 0);
				kph = kph.toFixed(2);
				$('#kpm-session-'+id).text(kph);

				$('#veh-'+id).text(vehicle_destroy);
				$('#shveh-'+id).html('<div class="clear"></div>');
				$.each(veh_list, function(key, value){
					$('#shveh-'+id).append('<div class="title more">'+key+'</div><div class="data">'+value+'</div><div class="clear">');
					veh_list[key] = 0;
				});

				$('#swep-'+id).html('<div class="title"></div><div class="data small"><div class="half">Kills</div>Headshot (HSR)</div><div class="clear"></div>');

				$.each(weapon_count, function(key, value){
					// // console.log('Getting weapon count');
				//	if (!$.isNumeric(weapon_hs[key])){weapon_hs[key] = 0;}
					var hsr = (weapon_hs[key]/value)*100;
					$('#swep-'+id).append('<div class="title more">'+weapon_list[key]+'</div><div class="data"><div class="half">'+value+'</div>'+weapon_hs[key]+' ('+hsr.toFixed(2)+'%)</div><div class="clear">');
					weapon_count[key] = 0;
				});

				if (kd > 0){
					var ktd = $('#at-ktd-'+id).text();
					var ktd_week = $('#ktd-session-'+id).text();
					var spm = $('#at-spm-'+id).text();
					var spm_week = $('#spm-session-'+id).text();

					var ktd_week_change = ((ktd_week - ktd)/ktd)*100;
					ktd_week_change = ktd_week_change.toFixed(1);
					var spm_week_change = ((spm_week - spm)/spm)*100;
					spm_week_change = spm_week_change.toFixed(1);

					var performance_week = (parseInt(ktd_week_change) + parseInt(spm_week_change))/2;
					if (performance_week > 0){
						performance_week_direction = '% Improvement';
					} else {
						performance_week = Math.abs(performance_week);
						performance_week_direction = '% Decline';
					}

					$('#perf-session-'+id).text(performance_week.toFixed(1)+performance_week_direction);
				}

				graph_mins = duration_int/1800;
				graph_mins = parseFloat(graph_mins.toFixed(0));


				// generate the graph
				$('#damage-graph-'+id).html('<div class="damage-axis" id="damage-axis-'+id+'">');
				var dg_height = parseInt($('#damage-graph-'+id).height());
				var dg_width = $('#'+id).width();
				var dg_cell_width = dg_width/((duration_int/60)/graph_mins);
				var dg_point_width = dg_width/duration_int;

				var cells = dg_width/dg_cell_width;
				if (isFinite(cells)){

					if (deaths >= kills){
						graph_max = deaths;
					} else {
						graph_max = kills;
					}

					graph_max_kdr = kd*2;
					// // console.log('Starting graph '+cells);
					for (var ii = 0; ii <= cells; ii++){
						// // console.log('Drawing Axis');
						$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="'+ii*dg_cell_width+'px" y1="0%" x2="'+ii*dg_cell_width+'px" y2="100%" style="stroke: rgba(33,95,100,0.5);stroke-width:1"></svg>');
					}

					var graph_half = graph_max/2;
					graph_half = graph_half.toFixed(0);

					var graph_half_kdr = graph_max_kdr/2;
					graph_half_kdr = graph_half_kdr.toFixed(2);

					$('#damage-graph-'+id).append('<div style="position: absolute; top: 38%; left: 3px;" class="graph-max x-axis" kdr="'+graph_half_kdr+'" max="'+graph_half+'">'+graph_half+'</div>');

					$('#damage-graph-'+id).append('<div style="position: absolute; top: -2px; left: 3px;" class="graph-half x-axis" kdr="'+graph_max_kdr+'" max="'+graph_max+'">'+graph_max+'</div>');
					var x_time = 0;
					for (var ii = 0; ii <= cells; ii++){
						$('#damage-axis-'+id).append('<div style="width: '+dg_cell_width+'px;" class="x-axis">'+x_time+'</div>');
						x_time = x_time+graph_mins;
					}

					graph_secs = graph_mins*60;

					if (graph_deaths.length > graph_kills.length){
						graph_top = graph_deaths.length-1;
					} else {
						graph_top = graph_kills.length-1;
					}

					x1 = 0;
					y1 = 100;
					y_size = parseFloat(dg_height/graph_top);
					y_size = y_size.toFixed(5);
					y_size = (y_size/dg_height)*100;
					y_size = y_size.toFixed(5);
				// console.log(max_kdr);
					y_size_mag = parseFloat(dg_height/graph_max_kdr);
					y_size_mag = y_size_mag.toFixed(5);
					y_size_mag = (y_size_mag/dg_height)*100;
					y_size_mag = y_size_mag.toFixed(5);

					sec_size = parseFloat(dg_width/duration_int);
					sec_size = sec_size.toFixed(5);
					graph_deaths.sort();
					cnt=0;

					$.each(graph_deaths, function(key, val){
						// // console.log('Drawing Deaths');
						chk = val-session_start;
						if (chk > 0){
							y2 = y1-y_size;
							if (isNaN(y2)){
								y2 = 0;
							}

							x2 = val-session_start;

							x2 = (x2/duration_int)*100;
							x2 = x2.toFixed(0);

							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-deaths" x1="'+x1+'%" y1="'+y1+'%" x2="'+x2+'%" y2="'+y2+'%" style="stroke: #840000;stroke-width:2"></svg>');
							x1 = x2;
							y1 = y2;
							cnt++;
						}

					});

					x2 = 100;
					y2 = y1;
					$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-deaths" x1="'+x1+'%" y1="'+y1+'%" x2="'+x2+'%" y2="'+y2+'%" style="stroke: #840000;stroke-width:2"></svg>');

					x1 = 0;
					y1 = 100;
					kdr1 = 100;
					kdr1_mag = 100;
					cnt = 0;
					graph_kills.sort();

					$.each(graph_kills, function(key, val){
						// // console.log('Drawing Kills');
						chk = val-session_start;
						if (chk > 0){
							y2 = y1-y_size;
							if (isNaN(y2)){
								y2 = 0;
							}

							x2 = val-session_start;

							x2 = (x2/duration_int)*100;
							x2 = x2.toFixed(0);
							if (cnt == graph_kills.length-1){
								y2 = 0;
								x2 = 100;
							}

							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-kills" x1="'+x1+'%" y1="'+y1+'%" x2="'+x2+'%" y2="'+y2+'%" style="stroke: #3BA1A1;stroke-width:2"></svg>');


							death_cnt = 0;
							$.each(graph_deaths, function(dkey, dval){
								if (dval < val){
									death_cnt++;
								//	// // console.log(dval);
								}
							});
							kdr = cnt/death_cnt;
							kdr = kdr.toFixed(3);
							if (isNaN(kdr)){
								kdr = 0;
							}
						//	// // console.log(cnt+' '+death_cnt+' '+kdr);
							kdr2 = 100-(kdr*y_size);
							kdr2_mag = 100-(kdr*y_size_mag);

							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-kdr" x1="'+x1+'%" y1="'+kdr1+'%" x2="'+x2+'%" y2="'+kdr2+'%" style="stroke: #69E4E4;stroke-width:2"></svg>');
							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-kdrmag hidden" x1="'+x1+'%" y1="'+kdr1_mag+'%" x2="'+x2+'%" y2="'+kdr2_mag+'%" style="stroke: #69E4E4;stroke-width:2"></svg>');
							kdr1 = kdr2;
							kdr1_mag = kdr2_mag;
							x1 = x2;
							y1 = y2;
							cnt++;
						}


					});

					x2 = 100;
					y2 = y1;

					$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-kills" x1="'+x1+'%" y1="'+y1+'%" x2="'+x2+'%" y2="'+y2+'%" style="stroke: #3BA1A1;stroke-width:2"></svg>');

					kdr2 = 100-(kd*y_size);
					kdr2_mag = 100-(kdr*y_size_mag);
					if (isNaN(kdr2)){
						kdr2 = 0;
					}

				//	// // console.log(x1+' '+kdr1+' '+x2+' '+kdr2+' '+kd);
					$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-kdr" x1="'+x1+'%" y1="'+kdr1+'%" x2="'+x2+'%" y2="'+kdr2+'%" style="stroke: #69E4E4;stroke-width:2"></svg>');
					$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line class="line-kdrmag hidden" x1="'+x1+'%" y1="'+kdr1_mag+'%" x2="'+x2+'%" y2="'+kdr2_mag+'%" style="stroke: #69E4E4;stroke-width:2"></svg>');

					// // console.log('Done the graph');
				}
			});

		}

		function getClass(id) {
			// console.log('Get Class:'+api_ver);
			$('#'+id+' .class-icon').remove();

			url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_stat?character_id='+id+'&c:limit=50&callback=?';

			$.getJSON(url, function(data){

				var class_time_week = 0;
				var class_time_month = 0;
				var class_time_at = 0;
				var hits = 0;
				var shots = 0;
				var assists = 0;
				var hits_week = 0;
				var shots_week = 0;
				var assists_week = 0;
				var hits_month = 0;
				var shots_month = 0;
				var assists_month = 0;

				for (var i=0; i < data.characters_stat_list.length; i++){

					if (data.characters_stat_list[i].stat_name == 'play_time' && parseInt(data.characters_stat_list[i].value_daily) > class_time_week){

						var char_class_week = parseInt(data.characters_stat_list[i].profile_id)+1;
						class_time_week = parseInt(data.characters_stat_list[i].value_weekly);

					}

					if (data.characters_stat_list[i].stat_name == 'play_time' && parseInt(data.characters_stat_list[i].value_monthly) > class_time_month){

						var char_class_month = parseInt(data.characters_stat_list[i].profile_id)+1;
						class_time_month = parseInt(data.characters_stat_list[i].value_monthly);

					}

					if (data.characters_stat_list[i].stat_name == 'play_time' && parseInt(data.characters_stat_list[i].value_forever) > class_time_at){

						var char_class_at = parseInt(data.characters_stat_list[i].profile_id)+1;
						class_time_at = parseInt(data.characters_stat_list[i].value_forever);

					}


				}

				if (char_class_week == 2 || char_class_week == 17 || char_class_week == 10){

					var img_week = 'Infiltrator';

				} else if (char_class_week == 4 || char_class_week == 19 || char_class_week == 12){

					var img_week = 'Light Assault';

				} else if (char_class_week == 5 || char_class_week == 20 || char_class_week == 13){

					var img_week = 'Combat Medic';

				} else if (char_class_week == 6 || char_class_week == 21 || char_class_week == 14){

					var img_week = 'Engineer';

				} else if (char_class_week == 7 || char_class_week == 22 || char_class_week == 15){

					var img_week = 'Heavy Assault';

				} else if (char_class_week == 8 || char_class_week == 23 || char_class_week == 16){

					var img_week = 'MAX';
				}

				if (char_class_month == 2 || char_class_month == 17 || char_class_month == 10){

					var img_month = 'Infiltrator';

				} else if (char_class_month == 4 || char_class_month == 19 || char_class_month == 12){

					var img_month = 'Light Assault';

				} else if (char_class_month == 5 || char_class_month == 20 || char_class_month == 13){

					var img_month = 'Combat Medic';

				} else if (char_class_month == 6 || char_class_month == 21 || char_class_month == 14){

					var img_month = 'Engineer';

				} else if (char_class_month == 7 || char_class_month == 22 || char_class_month == 15){

					var img_month = 'Heavy Assault';

				} else if (char_class_month == 8 || char_class_month == 23 || char_class_month == 16){

					var img_month = 'MAX';
				}

				if (char_class_at == 2 || char_class_at == 17 || char_class_at == 10){

					var img_at = 'Infiltrator';

				} else if (char_class_at == 4 || char_class_at == 19 || char_class_at == 12){

					var img_at = 'Light Assault';

				} else if (char_class_at == 5 || char_class_at == 20 || char_class_at == 13){

					var img_at = 'Combat Medic';

				} else if (char_class_at == 6 || char_class_at == 21 || char_class_at == 14){

					var img_at = 'Engineer';

				} else if (char_class_at == 7 || char_class_at == 22 || char_class_at == 15){

					var img_at = 'Heavy Assault';

				} else if (char_class_at == 8 || char_class_at == 23 || char_class_at == 16){

					var img_at = 'MAX';
				}

				if ($('.stat-card').length > 9){
					$('#class-week-'+id).html('<img src="css/'+img_week+'.png" class="class-icon">');
					$('#class-num-week-'+id).text(char_class_week);
					$('#class-month-'+id).html('<img src="css/'+img_month+'.png" class="class-icon">');
					$('#class-num-month-'+id).text(char_class_month);
					$('#class-at-'+id).html('<img src="css/'+img_at+'.png" class="class-icon">');
					$('#class-num-at-'+id).text(char_class_at);
				} else {
					$('#name-first-'+id).before('<img src="css/'+img_week+'.png" class="class-icon">');
				}



			});
			// // console.log('Got Class');
		}

		function getKillStats(id){

			url = 'https://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/character?character_id='+id+'&c:resolve=stat_by_faction,stat&callback=?';

			$.getJSON(url, function(data){

				var killstat = {};

				for (var i=0; i < data.character_list[0].stats.stat_by_faction.length; i++){

					if (!killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_at']){
						killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_at'] = 0;
						// // console.log(data.character_list[0].stats.stat_by_faction[i].stat_name);
					}
					if (!killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_monthly']){
						killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_monthly'] = 0;
					}
					if (!killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_weekly']){
						killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_weekly'] = 0;
					}

					killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_at'] = killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_at']+parseInt(data.character_list[0].stats.stat_by_faction[i].value_forever_nc)+parseInt(data.character_list[0].stats.stat_by_faction[i].value_forever_tr)+parseInt(data.character_list[0].stats.stat_by_faction[i].value_forever_vs);
					killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_monthly'] = killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_monthly']+parseInt(data.character_list[0].stats.stat_by_faction[i].value_monthly_nc)+parseInt(data.character_list[0].stats.stat_by_faction[i].value_monthly_tr)+parseInt(data.character_list[0].stats.stat_by_faction[i].value_monthly_vs);
					killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_weekly'] = killstat[data.character_list[0].stats.stat_by_faction[i].stat_name+'_weekly']+parseInt(data.character_list[0].stats.stat_by_faction[i].value_weekly_nc)+parseInt(data.character_list[0].stats.stat_by_faction[i].value_weekly_tr)+parseInt(data.character_list[0].stats.stat_by_faction[i].value_weekly_vs);

					if (i == data.character_list[0].stats.stat_by_faction.length-1){

						for (var ii=0; ii < data.character_list[0].stats.stat.length; ii++){

							if (!killstat[data.character_list[0].stats.stat[ii].stat_name+'_at']){
								killstat[data.character_list[0].stats.stat[ii].stat_name+'_at'] = 0;
								// // console.log(data.character_list[0].stats.stat[ii].stat_name);
							}

							if (!killstat[data.character_list[0].stats.stat[ii].stat_name+'_monthly']){
								killstat[data.character_list[0].stats.stat[ii].stat_name+'_monthly'] = 0;
							}

							if (!killstat[data.character_list[0].stats.stat[ii].stat_name+'_weekly']){
								killstat[data.character_list[0].stats.stat[ii].stat_name+'_weekly'] = 0;
							}

							killstat[data.character_list[0].stats.stat[ii].stat_name+'_at'] = killstat[data.character_list[0].stats.stat[ii].stat_name+'_at'] + parseInt(data.character_list[0].stats.stat[ii].value_forever);
							killstat[data.character_list[0].stats.stat[ii].stat_name+'_monthly'] = killstat[data.character_list[0].stats.stat[ii].stat_name+'_monthly'] + parseInt(data.character_list[0].stats.stat[ii].value_monthly);
							killstat[data.character_list[0].stats.stat[ii].stat_name+'_weekly'] = killstat[data.character_list[0].stats.stat[ii].stat_name+'_weekly'] + parseInt(data.character_list[0].stats.stat[ii].value_weekly);

							if (ii == data.character_list[0].stats.stat.length-1){

								acc = (killstat['hit_count_at']/killstat['fire_count_at'])*100;
								acc_monthly = (killstat['hit_count_monthly']/killstat['fire_count_monthly'])*100;
								acc_weekly = (killstat['hit_count_weekly']/killstat['fire_count_weekly'])*100;

								hsr = (killstat['weapon_headshots_at']/killstat['kills_at'])*100;
								hsr_monthly = (killstat['weapon_headshots_monthly']/killstat['kills_monthly'])*100;
								hsr_weekly = (killstat['weapon_headshots_weekly']/killstat['kills_weekly'])*100;

								// // console.log(killstat['killed_by_at']+' '+killstat['killed_by_monthly']+' '+killstat['killed_by_weekly']);

							//	revives = killstat['killed_by_at'] - parseInt($('#deaths-'+id).text());
							//	revives_monthly = killstat['killed_by_monthly'] - parseInt($('#deaths-month-'+id).text());
							//	revives_weekly = killstat['killed_by_weekly'] - parseInt($('#deaths-week-'+id).text());

								truekdr = killstat['kills_at']/killstat['killed_by_at'];
								truekdr_monthly = killstat['kills_monthly']/killstat['killed_by_monthly'];
								truekdr_weekly = killstat['kills_weekly']/killstat['killed_by_weekly'];

								$('#accuracy-'+id).text(acc.toFixed(2)+'%');
								$('#accuracy-week-'+id).text(acc_weekly.toFixed(2)+'%');
								$('#accuracy-month-'+id).text(acc_monthly.toFixed(2)+'%');

								$('#assists-'+id).text(killstat['assist_count_at']);
								$('#assists-week-'+id).text(killstat['assist_count_weekly']);
								$('#assists-month-'+id).text(killstat['assist_count_monthly']);

								$('#hsr-'+id).text(hsr.toFixed(2)+'%');
								$('#hsr-week-'+id).text(hsr_weekly.toFixed(2)+'%');
								$('#hsr-month-'+id).text(hsr_monthly.toFixed(2)+'%');

							//	$('#revives-'+id).text(revives);
							//	$('#revives-week-'+id).text(revives_weekly);
							//	$('#revives-month-'+id).text(revives_monthly);

								$('#truekdr-'+id).text(truekdr.toFixed(2));
								$('#truekdr-week-'+id).text(truekdr_weekly.toFixed(2));
								$('#truekdr-month-'+id).text(truekdr_monthly.toFixed(2));


							}

						}

					}

				}

			});

			url2 = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event_grouped?character_id='+id+'&type=KILL&c:sort=count&c:limit=2&c:join=character^on:character_id^to:character_id^inject_at:character_name^show:name.first%27battle_rank.value%27faction_id&callback=?';

			$.getJSON(url2, function(data2){

				var count = 0;
				var prev_count = 0;

				for (var i=0; i < data2.characters_event_grouped_list.length; i++){

					count = data2.characters_event_grouped_list[i].count;
					if(data2.characters_event_grouped_list[i].character_name.faction_id == 1){img = 'css/vs.png';}
					if(data2.characters_event_grouped_list[i].character_name.faction_id == 2){img = 'css/nc.png';}
					if(data2.characters_event_grouped_list[i].character_name.faction_id == 3){img = 'css/tr.png';}

					if (data2.characters_event_grouped_list[i].character_id == id){
					//	$('#suicides-'+id).text(data2.characters_event_grouped_list[i].count);
					} else {
						if (count > prev_count){
							$('#dom-'+id).html('<img src="'+img+'" class="faction-icon small"> <a href="'+data2.characters_event_grouped_list[i].character_name.name.first+'" target="character" class="blue">'+data2.characters_event_grouped_list[i].character_name.name.first+'</a> <span class="white">['+data2.characters_event_grouped_list[i].character_name.battle_rank.value+']</span> '+data2.characters_event_grouped_list[i].count);
							prev_count = count;
						}
					}

				}

			});

			url3 = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event_grouped?character_id='+id+'&type=DEATH&c:sort=count&c:limit=2&c:join=character^on:character_id^to:character_id^inject_at:character_name^show:name.first%27battle_rank.value%27faction_id&callback=?';

			$.getJSON(url3, function(data3){

				var count = 0;
				var prev_count = 0;

				for (var i=0; i < data3.characters_event_grouped_list.length; i++){

					count = data3.characters_event_grouped_list[i].count;
					if(data3.characters_event_grouped_list[i].character_name.faction_id == 1){img = 'css/vs.png';}
					if(data3.characters_event_grouped_list[i].character_name.faction_id == 2){img = 'css/nc.png';}
					if(data3.characters_event_grouped_list[i].character_name.faction_id == 3){img = 'css/tr.png';}

					if (data3.characters_event_grouped_list[i].character_id == id){
					//	$('#suicides-'+id).text(data3.characters_event_grouped_list[i].count);
					} else {
						if (count > prev_count){
							$('#domer-'+id).html('<img src="'+img+'" class="faction-icon small"> <a href="'+data3.characters_event_grouped_list[i].character_name.name.first+'" target="character" class="blue">'+data3.characters_event_grouped_list[i].character_name.name.first+'</a> <span class="white">['+data3.characters_event_grouped_list[i].character_name.battle_rank.value+']</span> '+data3.characters_event_grouped_list[i].count);
							prev_count = count;
						}
					}

				}

			});

			$('#kdr-'+id).toggle();

		}


		function getWorldPop(id){


			var world_id = $('#server3-'+id).text();
			// // console.log($(this).attr('id'));
			url = 'http://api.therebelscum.net/PlanetSide/server_status/?world_id='+world_id+'&callback=?';
			$.getJSON(url, function(data){

				var get_world_time = timeConverter(data.population.data_fetched);
				$('#worldpop-nc-'+id).html('<div class="half">'+data.population.nc.population_percentage+'</div>'+data.population.nc.population_count);
				$('#worldpop-tr-'+id).html('<div class="half">'+data.population.tr.population_percentage+'</div>'+data.population.tr.population_count);
				$('#worldpop-vs-'+id).html('<div class="half">'+data.population.vs.population_percentage+'</div>'+data.population.vs.population_count);
				var pop_tot = parseInt(data.population.nc.population_count)+parseInt(data.population.tr.population_count)+parseInt(data.population.vs.population_count);
				$('#worldpop-tot-'+id).html('<div class="half">'+get_world_time+'</div>'+pop_tot);
				$('#worldpop-'+id).toggle();

			});

		}

		function getCharWeaponStatsNEW(id){

			if ($('#wstat-'+id).is(':visible')) {

				$('#wstat-'+id).toggle();

			} else {

				$('#wstat-'+id).before('<div id="wstatloader"><img src="css/loader.gif" class="loader"></div>');
				$('#wstat-'+id).html('<div class="clear"></div><div class="small float-left absolute"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'name\');">Name</a></div><div class="cell small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'weapon_deaths\');">Kills</a></div><div class="cell small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'accuracy\');">Accuracy</a></div><div class="cell small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'weapon_headshots\');">HSR</a></div><!--<div class="cell small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'weapon_lethality\');">Lethality</a></div>--><div class="cell small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'weapon_vehicle_kills\');">Vehicle Kills</a></div><div class="hidden small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'weapon_score\');">Score</a></div><div class="cell small"><a href="javascript:void(0)" onClick="wstatSort(\''+id+'\',\'weapon_play_time\');">Time</a></div><div class="clear"></div>');

				url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_weapon_stat?character_id='+id+'&c:limit=2000&c:join=item^on:item_id^to:item_id^inject_at:weapon^hide:description&callback=?';
				var stat = {};

				$.getJSON(url, function(data){

					for (var i=0; i < data.characters_weapon_stat_list.length; i++){

						if (typeof data.characters_weapon_stat_list[i].weapon != 'undefined'){

							var weapon = data.characters_weapon_stat_list[i].weapon.name.en;
							var weapon_parse = data.characters_weapon_stat_list[i].item_id;

							if ($('#wstat-'+id+' #'+weapon_parse+'-'+id).length < 1){
								$('#wstat-'+id).append('<div class="weapon '+data.characters_weapon_stat_list[i].item_id+'" id="'+weapon_parse+'-'+id+'"><div class="name">'+weapon+'</div><div class="cell weapon_deaths" id="'+weapon_parse+'-'+id+'-weapon_deaths">0</div><div class="cell accuracy" id="'+weapon_parse+'-'+id+'-accuracy">0</div><div class="cell weapon_headshots" id="'+weapon_parse+'-'+id+'-weapon_headshots">0</div><!--<div class="cell weapon_lethality" id="'+weapon_parse+'-'+id+'-weapon_lethality">0</div>--><div class="cell weapon_vehicle_kills" id="'+weapon_parse+'-'+id+'-weapon_vehicle_kills">0</div><div class="hidden" id="'+weapon_parse+'-'+id+'-weapon_fire_count">-</div><div class="hidden" id="'+weapon_parse+'-'+id+'-weapon_hit_count">-</div><div class="hidden weapon_score" id="'+weapon_parse+'-'+id+'-weapon_score">0</div><div class="weapon_play_time hidden" id="'+weapon_parse+'-'+id+'-weapon_play_time_int">-</div><div class="cell" id="'+weapon_parse+'-'+id+'-weapon_play_time">-</div><div class="clear"></div></div>');
							}

							if (data.characters_weapon_stat_list[i].stat_name == 'weapon_play_time'){
								var play_time = getTimeFromSecs(data.characters_weapon_stat_list[i].value*60);
								$('#'+weapon_parse+'-'+id+'-'+data.characters_weapon_stat_list[i].stat_name).text(play_time);
								$('#'+weapon_parse+'-'+id+'-'+data.characters_weapon_stat_list[i].stat_name+'_int').text(data.characters_weapon_stat_list[i].value);
							} else if (data.characters_weapon_stat_list[i].stat_name != 'weapon_deaths'){
								$('#'+weapon_parse+'-'+id+'-'+data.characters_weapon_stat_list[i].stat_name).text(data.characters_weapon_stat_list[i].value);
							}

						}

						if (i == data.characters_weapon_stat_list.length-1){

							$('#wstat-'+id+' .weapon').each(function(){

								var weapon = $(this).attr('id').replace('-'+id,'');
								if ($(this).children('#'+weapon+'-'+id+'-weapon_play_time').text() == '-'){
									$(this).remove();
									return;
								}

								if ($(this).children('#'+weapon+'-'+id+'-weapon_fire_count').text() == '-'){
									$(this).remove();
									return;
								}

								if ($(this).children('#'+weapon+'-'+id+'-weapon_score').text() == '0'){
									$(this).remove();
									return;
								}

								if ($('#'+weapon+'-'+id+'-weapon_hit_count').text() != '-'){
									var hits = parseInt($(this).children('#'+weapon+'-'+id+'-weapon_hit_count').text());
									var fire = parseInt($(this).children('#'+weapon+'-'+id+'-weapon_fire_count').text());

									var acc = (hits/fire)*100;
									$('#'+weapon+'-'+id+'-accuracy').text(acc.toFixed(2)+'%');
								}

							});

							url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/character?character_id='+id+'&c:resolve=weapon_stat_by_faction&c:limit=2000&callback=?';
							$.getJSON(url, function(data){

								for (var ii=0; ii < data.character_list[0].stats.weapon_stat_by_faction.length; ii++){

									var item_id = data.character_list[0].stats.weapon_stat_by_faction[ii].item_id;

									if (data.character_list[0].stats.weapon_stat_by_faction[ii].stat_name == 'weapon_kills'){
										var val = parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_nc)+parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_tr)+parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_vs);
										if ($('#wstat-'+id+' .'+item_id).length > 0){
											$('#wstat-'+id+' .'+item_id+' .weapon_deaths').text(val);
											var hits = parseInt($('#'+item_id+'-'+id+'-weapon_hit_count').text());

											var lethality = (val/hits)*100;
										//	$('#wstat-'+id+' .'+item_id+' .weapon_lethality').text(lethality.toFixed(2)+'%');
										}

										var hs = parseInt($('#wstat-'+id+' .'+item_id+' .weapon_headshots').text());

										if (hs > 0){
											hsr = (hs/val)*100;
											$('#wstat-'+id+' .'+item_id+' .weapon_headshots').text(' '+hsr.toFixed(2)+'%');
										}
									}

									if (data.character_list[0].stats.weapon_stat_by_faction[ii].stat_name == 'weapon_headshots'){
										var hs = parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_nc)+parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_tr)+parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_vs);
										if ($('#wstat-'+id+' .'+item_id).length > 0){
											$('#wstat-'+id+' .'+item_id+' .weapon_headshots').text(hs);
										}

										var kills = parseInt($('#wstat-'+id+' .'+item_id+' .weapon_deaths').text());

										if (kills > 0){
											hsr = (hs/kills)*100;
											$('#wstat-'+id+' .'+item_id+' .weapon_headshots').text(hsr.toFixed(2)+'%');
										}
									}

									if (data.character_list[0].stats.weapon_stat_by_faction[ii].stat_name == 'weapon_vehicle_kills'){
										var val = parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_nc)+parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_tr)+parseInt(data.character_list[0].stats.weapon_stat_by_faction[ii].value_vs);
										if ($('#wstat-'+id+' .'+item_id).length > 0){
											$('#wstat-'+id+' .'+item_id+' .weapon_vehicle_kills').text(val);
										}
									}

									if (ii == data.character_list[0].stats.weapon_stat_by_faction.length-1){
										wstatSort(id,'weapon_deaths',0);
										$('#wstatloader').remove();
										$('#wstat-'+id).toggle();
									}
								}

							});

						}
					}

				});
			}


		}


		function getKillBoard(id, update, type){

			if (type == 'all'){
				type = 'KILL,DEATH,VEHICLE_DESTROY';
			}

			url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event/?character_id=' +id+ '&type='+type+'&c:limit=50&c:join=character^on:attacker_character_id^to:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:attacker&c:join=character^on:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:victim&c:join=item^on:attacker_weapon_id^to:item_id^show:name.en^inject_at:attacker.weapon&c:join=vehicle^on:attacker_vehicle_id^to:vehicle_definition_id^show:name.en^inject_at:attacker.vehicle&c:join=vehicle^on:vehicle_definition_id^to:vehicle_id^show:name.en^inject_at:victim.vehicle&c:join=loadout^on:attacker_loadout_id^to:loadout_id^inject_at:attacker_class&c:join=loadout^on:character_loadout_id^to:loadout_id^inject_at:victim_class&callback=?';

			var deaths=0;
			var kills=0;
			var vehicle_destroy=0;

			var destroy = {};
			destroy[0] = ' Destroyed';
			destroy[1] = ' Taken Out';
			destroy[2] = ' Wrecked';
			destroy[3] = ' Down';

			var time_prev = 9999999999;

			if (update == 'open'){
				$('#kb-'+id).toggle();
				url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event/?character_id=' +id+ '&type='+type+'&c:limit=50&c:join=character^on:attacker_character_id^to:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:attacker&c:join=character^on:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:victim&c:join=item^on:attacker_weapon_id^to:item_id^inject_at:attacker.weapon&c:join=vehicle^on:attacker_vehicle_id^to:vehicle_id^show:name.en^inject_at:attacker.vehicle&c:join=vehicle^on:vehicle_definition_id^to:vehicle_id^show:name.en^inject_at:victim.vehicle&c:join=loadout^on:attacker_loadout_id^to:loadout_id^inject_at:attacker_class&c:join=loadout^on:character_loadout_id^to:loadout_id^inject_at:victim_class&callback=?';
				$('#kb-'+id).html('');
				$('#kb-'+id).html('<img src="css/loader.gif" class="loader">');
			} else {
				url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event/?character_id=' +id+ '&type='+type+'&c:limit=1&c:join=character^on:attacker_character_id^to:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:attacker&c:join=character^on:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:victim&c:join=item^on:attacker_weapon_id^to:item_id^inject_at:attacker.weapon&c:join=vehicle^on:attacker_vehicle_id^to:vehicle_id^show:name.en^inject_at:attacker.vehicle&c:join=vehicle^on:vehicle_definition_id^to:vehicle_id^show:name.en^inject_at:victim.vehicle&c:join=loadout^on:attacker_loadout_id^to:loadout_id^inject_at:attacker_class&c:join=loadout^on:character_loadout_id^to:loadout_id^inject_at:victim_class&callback=?';
			}

			$.getJSON(url, function(data){

				if (update == 'open'){
					$('#kb-'+id).html('');
				}

				for (var i=0;i<data.characters_event_list.length;i++){

				// define unique data
					var rand = Math.floor(Math.random() * 4) + 0;

					var kb_weapon = 'Unknown';

					if (typeof data.characters_event_list[i].attacker != 'undefined' && data.characters_event_list[i].attacker.weapon){
						kb_weapon = data.characters_event_list[i].attacker.weapon.name.en;
					}


					var kb_attacker_vehicle = '';
					if (data.characters_event_list[i].attacker && data.characters_event_list[i].attacker.vehicle && kb_weapon != data.characters_event_list[i].attacker.vehicle.name.en){
						if (kb_weapon == 'Unknown'){
							if (data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].character_id == id && data.characters_event_list[i].zone_id != 97){
								kb_weapon = '<span class="red">'+data.characters_event_list[i].attacker.vehicle.name.en+' Crashed</span>';
							} else {
								kb_weapon = '<span class="blue">'+data.characters_event_list[i].attacker.vehicle.name.en+' Roadkill!</span>';
							}
						} else {
							kb_weapon = data.characters_event_list[i].attacker.vehicle.name.en+' '+kb_weapon;
						}
					}

					if (typeof data.characters_event_list[i].attacker != 'undefined' && data.characters_event_list[i].attacker.weapon){
						kb_weapon = '<a href="'+data.characters_event_list[i].attacker.weapon.item_id+'" target="weapons">'+kb_weapon+'</a>';
					}

				// define data based of kb type, ie, kills, deaths etc

					if (data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].character_id == id && data.characters_event_list[i].zone_id != 97){

						var kb_type = 'killed';
						var kb_name = 'Unknown';
						var kb_rank = '[]';
						if (data.characters_event_list[i].attacker.name){
							kb_name = data.characters_event_list[i].attacker.name.first;
							kb_rank = '['+data.characters_event_list[i].attacker.battle_rank.value+']';
							if(data.characters_event_list[i].attacker.faction_id == 1){img = 'css/vs.png';}
							if(data.characters_event_list[i].attacker.faction_id == 2){img = 'css/nc.png';}
							if(data.characters_event_list[i].attacker.faction_id == 3){img = 'css/tr.png';}
						}

						var kb_kill_txt = '<span class="red">Suicide</span>';

						if (typeof data.characters_event_list[i].attacker_class != 'undefined'){
							var class_img = data.characters_event_list[i].attacker_class.code_name.split(' ')[1];
							if (class_img == 'Light'){
								class_img = 'Light Assault';
							}
							if (class_img == 'Medic'){
								class_img = 'Combat Medic';
							}
							if (class_img == 'Heavy'){
								class_img = 'Heavy Assault';
							}
							var kb_class_img = "<span><img src='css/"+class_img+".png' class='faction-icon'></span>";
						} else {
							var kb_class_img = "";
						}

					} else if (data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].zone_id != 97){

						var kb_type = 'kill';
						var kb_name = 'Unknown';
						var kb_rank = '[]';
						var kb_tk = '';
						var kb_tk_end = '';

						if (data.characters_event_list[i].victim && data.characters_event_list[i].victim.name){
							kb_name = data.characters_event_list[i].victim.name.first;
							kb_rank = '['+data.characters_event_list[i].victim.battle_rank.value+']';

							if(data.characters_event_list[i].victim.faction_id == 1){img = 'css/vs.png';}
							if(data.characters_event_list[i].victim.faction_id == 2){img = 'css/nc.png';}
							if(data.characters_event_list[i].victim.faction_id == 3){img = 'css/tr.png';}

						}
						var kb_kill_txt = 'Killed';
						if (data.characters_event_list[i].victim && data.characters_event_list[i].attacker && data.characters_event_list[i].attacker.faction_id == data.characters_event_list[i].victim.faction_id){
							kb_kill_txt = '<span class="red">Team Kill</span>';
						}

						if (data.characters_event_list[i].victim && data.characters_event_list[i].victim.vehicle){
							kb_kill_txt = '<span class="red">'+kb_tk+kb_tk_end+data.characters_event_list[i].victim.vehicle.name.en+' '+destroy[rand]+'</span>';
						}

						if (typeof data.characters_event_list[i].victim_class != 'undefined'){
							var class_img = data.characters_event_list[i].victim_class.code_name.split(' ')[1];
							if (class_img == 'Light'){
								class_img = 'Light Assault';
							}
							if (class_img == 'Medic'){
								class_img = 'Combat Medic';
							}
							if (class_img == 'Heavy'){
								class_img = 'Heavy Assault';
							}
							var kb_class_img = "<span><img src='css/"+class_img+".png' class='faction-icon'></span>";
						} else {
							var kb_class_img = "";
						}

					} else {

						var kb_type = 'killed';
						var kb_name = 'Unknown';
						var kb_rank = '[]';
						var kb_tk = '';

						if (data.characters_event_list[i].attacker && data.characters_event_list[i].attacker.name){
							kb_name = data.characters_event_list[i].attacker.name.first;
							kb_rank = '['+data.characters_event_list[i].attacker.battle_rank.value+']';
							if(data.characters_event_list[i].attacker.faction_id == 1){img = 'css/vs.png';}
							if(data.characters_event_list[i].attacker.faction_id == 2){img = 'css/nc.png';}
							if(data.characters_event_list[i].attacker.faction_id == 3){img = 'css/tr.png';}

							if (data.characters_event_list[i].attacker.faction_id == data.characters_event_list[i].victim.faction_id){
								kb_tk = 'Team ';
							}
						}

						var kb_kill_txt = '<span class="red">'+kb_tk+'Killed by</span>';

						if (data.characters_event_list[i].is_headshot != 0){
							kb_kill_txt = '<span class="red">Headshot</span>';
						}

						if (data.characters_event_list[i].victim && data.characters_event_list[i].victim.vehicle){
							kb_kill_txt = '<span class="red">'+kb_tk+data.characters_event_list[i].victim.vehicle.name.en+' '+destroy[rand]+'</span>';
						}

						if (typeof data.characters_event_list[i].attacker_class != 'undefined'){
							var class_img = data.characters_event_list[i].attacker_class.code_name.split(' ')[1];
							if (class_img == 'Light'){
								class_img = 'Light Assault';
							}
							if (class_img == 'Medic'){
								class_img = 'Combat Medic';
							}
							if (class_img == 'Heavy'){
								class_img = 'Heavy Assault';
							}
							var kb_class_img = "<span><img src='css/"+class_img+".png' class='faction-icon'></span>";
						} else {
							var kb_class_img = "";
						}

					}

					if (update == 'open'){
						$('#kb-'+id).append('<div class="kb-item '+kb_type+'">'+timeConverter(data.characters_event_list[i].timestamp)+' <span class="float-right"><img src="'+img+'" class="faction-icon big"><a href="'+kb_name+'" target="other" class="blue">'+kb_name+'</a> '+kb_rank+' '+kb_class_img+'</span><br>'+kb_kill_txt+'<span class="float-right">'+kb_weapon+'</span></div>');
					} else {
						$('#kb-'+id).prepend('<div class="kb-item '+kb_type+'">'+timeConverter(data.characters_event_list[i].timestamp)+' <span class="float-right"><img src="'+img+'" class="faction-icon big"><a href="'+kb_name+'" target="other" class="blue">'+kb_name+'</a> '+kb_rank+' '+kb_class_img+'</span><br>'+kb_kill_txt+'<span class="float-right">'+kb_weapon+'</span></div>');
						$('#st-'+id).html(kb_kill_txt+'<img src="'+img+'" class="faction-icon">'+kb_class_img+'<span class="blue">'+kb_name+'</span> ['+kb_rank+'] '+kb_weapon);
					}

					if (i >= data.characters_event_list.length-1){
						$('#kb-'+id).append('<a href="javascript:void(0)" onClick="moreKillBoard(\''+id+'\',\''+data.characters_event_list[i].timestamp+'\');" id="kbmore" class="link float-right">more...</a><br>');
					}

				}


			});

		}

		function moreKillBoard(id, time){

			url = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_event/?character_id=' +id+ '&type=KILL,DEATH,VEHICLE_DESTROY&c:limit=120&c:join=character^on:attacker_character_id^to:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:attacker&c:join=character^on:character_id^show:name.first%27battle_rank.value%27faction_id^inject_at:victim&c:join=item^on:attacker_weapon_id^to:item_id^show:name.en^inject_at:attacker.weapon&c:join=vehicle^on:attacker_vehicle_id^to:vehicle_id^show:name.en^inject_at:attacker.vehicle&c:join=vehicle^on:vehicle_definition_id^to:vehicle_id^show:name.en^inject_at:victim.vehicle&c:join=loadout^on:attacker_loadout_id^to:loadout_id^inject_at:attacker_class&c:join=loadout^on:character_loadout_id^to:loadout_id^inject_at:victim_class&before='+time+'&&callback=?';

			$('#kbmore').html('<img src="css/loader.gif" class="loader">');
		//	$('#kb-'+id).toggle();

			var update = 'open';

			var destroy = {};
			destroy[0] = ' Destroyed';
			destroy[1] = ' Taken Out';
			destroy[2] = ' Wrecked';
			destroy[3] = ' Down';

			var time_prev = 9999999999;

			$.getJSON(url, function(data){
				// $('#kb-'+id).html('');
				$('#kbmore').remove();
				for (var i=0;i<data.characters_event_list.length;i++){

					var time_chk = time_prev - parseInt(data.characters_event_list[i].timestamp);

					if (time_chk > 7200 && time_prev != 9999999999){

						$('#kb-'+id).append('<a href="javascript:void(0)" onClick="moreKillBoard(\''+id+'\',\''+data.characters_event_list[i].timestamp+'\');" id="kbmore" class="link float-right">more...</a>');
						$('#kb-'+id).append('<br>');
						return;
					}

					time_prev = data.characters_event_list[i].timestamp;

					// define unique data
						var rand = Math.floor(Math.random() * 4) + 0;

						var kb_weapon = 'Unknown';
						if (typeof data.characters_event_list[i].attacker != 'undefined' && data.characters_event_list[i].attacker.weapon){
							kb_weapon = data.characters_event_list[i].attacker.weapon.name.en;
						}

						var kb_attacker_vehicle = '';
						if (data.characters_event_list[i].attacker && data.characters_event_list[i].attacker.vehicle && kb_weapon != data.characters_event_list[i].attacker.vehicle.name.en){
							if (kb_weapon == 'Unknown'){
								if (data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].character_id == id && data.characters_event_list[i].zone_id != 97){
									kb_weapon = '<span class="red">'+data.characters_event_list[i].attacker.vehicle.name.en+' Crashed</span>';
								} else {
									kb_weapon = '<span class="blue">'+data.characters_event_list[i].attacker.vehicle.name.en+' Roadkill!</span>';
								}
							} else {
								kb_weapon = data.characters_event_list[i].attacker.vehicle.name.en+' '+kb_weapon;
							}
						}

						if (typeof data.characters_event_list[i].attacker != 'undefined' && data.characters_event_list[i].attacker.weapon){
							kb_weapon = '<a href="'+data.characters_event_list[i].attacker.weapon.item_id+'" target="weapons">'+kb_weapon+'</a>';
						}

					// define data based of kb type, ie, kills, deaths etc

						if (data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].character_id == id && data.characters_event_list[i].zone_id != 97){

							var kb_type = 'killed';
							var kb_name = 'Unknown';
							var kb_rank = '[]';
							if (data.characters_event_list[i].attacker && data.characters_event_list[i].attacker.name){
								kb_name = data.characters_event_list[i].attacker.name.first;
								kb_rank = '['+data.characters_event_list[i].attacker.battle_rank.value+']';

								if(data.characters_event_list[i].attacker.faction_id == 1){img = 'css/vs.png';}
								if(data.characters_event_list[i].attacker.faction_id == 2){img = 'css/nc.png';}
								if(data.characters_event_list[i].attacker.faction_id == 3){img = 'css/tr.png';}
							}

							var kb_kill_txt = '<span class="red">Suicide</span>';

							if (typeof data.characters_event_list[i].attacker_class != 'undefined'){
								var class_img = data.characters_event_list[i].attacker_class.code_name.split(' ')[1];
								if (class_img == 'Light'){
									class_img = 'Light Assault';
								}
								if (class_img == 'Medic'){
									class_img = 'Combat Medic';
								}
								if (class_img == 'Heavy'){
									class_img = 'Heavy Assault';
								}
								var kb_class_img = "<span><img src='css/"+class_img+".png' class='faction-icon'></span>";
							} else {
								var kb_class_img = "";
							}

						} else if (data.characters_event_list[i].attacker_character_id == id && data.characters_event_list[i].zone_id != 97){

							var kb_type = 'kill';
							var kb_name = 'Unknown';
							var kb_rank = '[]';
							if (data.characters_event_list[i].victim && data.characters_event_list[i].victim.name){
								kb_name = data.characters_event_list[i].victim.name.first;
								kb_rank = '['+data.characters_event_list[i].victim.battle_rank.value+']';

								if(data.characters_event_list[i].victim.faction_id == 1){img = 'css/vs.png';}
								if(data.characters_event_list[i].victim.faction_id == 2){img = 'css/nc.png';}
								if(data.characters_event_list[i].victim.faction_id == 3){img = 'css/tr.png';}

							}
							var kb_kill_txt = 'Killed';
							if (data.characters_event_list[i].victim && data.characters_event_list[i].attacker && data.characters_event_list[i].attacker.faction_id == data.characters_event_list[i].victim.faction_id){
								kb_kill_txt = '<span class="red">Team Kill</span>';
							}

							if (data.characters_event_list[i].is_headshot != 0){
								kb_kill_txt = '<span class="blue">Headshot</span>';
							}

							if (data.characters_event_list[i].victim && data.characters_event_list[i].victim.vehicle){
								kb_kill_txt = '<span class="blue">'+data.characters_event_list[i].victim.vehicle.name.en+' '+destroy[rand]+'</span>';
							}

							if (typeof data.characters_event_list[i].victim_class != 'undefined'){
								var class_img = data.characters_event_list[i].victim_class.code_name.split(' ')[1];
								if (class_img == 'Light'){
									class_img = 'Light Assault';
								}
								if (class_img == 'Medic'){
									class_img = 'Combat Medic';
								}
								if (class_img == 'Heavy'){
									class_img = 'Heavy Assault';
								}
								var kb_class_img = "<span><img src='css/"+class_img+".png' class='faction-icon'></span>";
							} else {
								var kb_class_img = "";
							}

						} else {

							var kb_type = 'killed';
							var kb_name = 'Unknown';
							var kb_rank = '[]';
							if (typeof data.characters_event_list[i].attacker != 'undefined'){
								kb_name = data.characters_event_list[i].attacker.name.first;
								kb_rank = '['+data.characters_event_list[i].attacker.battle_rank.value+']';
								if(data.characters_event_list[i].attacker.faction_id == 1){img = 'css/vs.png';}
								if(data.characters_event_list[i].attacker.faction_id == 2){img = 'css/nc.png';}
								if(data.characters_event_list[i].attacker.faction_id == 3){img = 'css/tr.png';}
							}

							var kb_kill_txt = '<span class="red">Killed by</span>';

							if (data.characters_event_list[i].is_headshot != 0){
								kb_kill_txt = '<span class="red">Headshot</span>';
							}

							if (data.characters_event_list[i].victim && data.characters_event_list[i].victim.vehicle){
								kb_kill_txt = '<span class="red">'+data.characters_event_list[i].victim.vehicle.name.en+' '+destroy[rand]+'</span>';
							}

							if (typeof data.characters_event_list[i].attacker_class != 'undefined'){
								var class_img = data.characters_event_list[i].attacker_class.code_name.split(' ')[1];
								if (class_img == 'Light'){
									class_img = 'Light Assault';
								}
								if (class_img == 'Medic'){
									class_img = 'Combat Medic';
								}
								if (class_img == 'Heavy'){
									class_img = 'Heavy Assault';
								}
								var kb_class_img = "<span><img src='css/"+class_img+".png' class='faction-icon'></span>";
							} else {
								var kb_class_img = "";
							}

						}

						if (update == 'open'){
							$('#kb-'+id).append('<div class="kb-item '+kb_type+'">'+timeConverter(data.characters_event_list[i].timestamp)+' <span class="float-right"><img src="'+img+'" class="faction-icon big"><a href="'+kb_name+'" target="other" class="blue">'+kb_name+'</a> '+kb_rank+' '+kb_class_img+'</span><br>'+kb_kill_txt+'<span class="float-right">'+kb_weapon+'</span></div>');
						} else {
							$('#kb-'+id).prepend('<div class="kb-item '+kb_type+'">'+timeConverter(data.characters_event_list[i].timestamp)+' <span class="float-right"><img src="'+img+'" class="faction-icon big"><a href="'+kb_name+'" target="other" class="blue">'+kb_name+'</a> '+kb_rank+' '+kb_class_img+'</span><br>'+kb_kill_txt+'<span class="float-right">'+kb_weapon+'</span></div>');
							$('#st-'+id).html(kb_kill_txt+'<img src="'+img+'" class="faction-icon">'+kb_class_img+'<span class="blue">'+kb_name+'</span> ['+kb_rank+'] '+kb_weapon);
						}

						if (i >= data.characters_event_list.length-1){
							$('#kb-'+id).append('<a href="javascript:void(0)" onClick="moreKillBoard(\''+id+'\',\''+data.characters_event_list[i].timestamp+'\');" id="kbmore" class="link float-right">more...</a><br>');
						}
					}




			});

		}

		function select(id){

			$('#'+id).toggleClass('selected');

		}

		function selectAll(){

			$('.stat-card').each(function(){

				if ($(this).is(":visible")){
					$(this).toggleClass('selected');
				}

			});

		}

		function showAll(){

			$('.stat-card').each(function(){

				$(this).removeClass('hidden');
				$(this).show();

			});

		}

		function showSelected(){

			$('.stat-card').each(function(){

				if ($(this).hasClass("selected")){
					$(this).removeClass('hidden');
					$(this).show();
				} else {
					$(this).hide();
				}


			});

		}

		function selectOnline() {

			$('.sort-online').each(function(){
				var online = $(this).text();
				if (online == 'ONLINE'){
					$(this).parent('tr').addClass('selected');
				}
			});


		}

		function setCookie(cname, cvalue, exdays) {
			var d = new Date();
			d.setTime(d.getTime() + (exdays*24*60*60*1000));
			var expires = "expires="+d.toGMTString();
			document.cookie = cname + "=" + cvalue + "; " + expires;
		}

		function getCookie(cname) {
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for(var i=0; i<ca.length; i++) {
				var c = ca[i].trim();
				if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
			}
			return "";
		}



		function getTimeFromSecs(secs){

			var sec_num = secs/60; // don't forget the second param
			var hours   = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours   < 10) {hours   = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}
		//	var time    = hours+'h '+minutes+'m '+seconds+'s';
			var time    = hours+'h '+minutes+'m';
			return time;

		//	var hours = parseInt( secs / 3600 ) % 24;
//			var hours = secs.getHours();
//			var minutes = parseInt( secs / 60 ) % 60;
//			var seconds = (secs % 60).toFixed(0);

//			var duration = (hours < 10 ? "0" + hours : hours) + "h " + (minutes < 10 ? "0" + minutes : minutes) + "m " + (seconds  < 10 ? "0" + seconds : seconds) + 's';
//			return duration;

		}

		function getOutfit(alias){

			$('html').css('background-image', 'url(css/ps2_3.jpg)');
			$('.wrapper').html('');
			$('.wrapper').prepend("<div class='over-header text-left bg-black'>PlanetStats.net | <a href='/' class='link'>Characters</a> | <a href='/weapons' class='link' id='weapon_link'>Weapons</a> | <a href='/data/weapons' class='link' id='weapon_link'>Weapon Data</a> | <a href='http://www.redbubble.com/people/l-33/collections/465010-planetside' target='redbubble' class='link'>Support the Site</a><a href='http://www.reddit.com/r/Planetside/comments/28b8j4/welcome_to_your_new_stat_trackercomparerwebapp/' class='link float-right'>[?]</a><form class='float-right' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_top'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='NY6SE74FJTL5A'><input type='image' src='https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='PayPal – The safer, easier way to pay online.'><img alt='' height='0px' border='0' src='https://www.paypalobjects.com/en_GB/i/scr/pixel.gif' width='1' height='1'></form></div>");
			$('.wrapper').append('<div class="content"><input type="text" id="search" class="no-padding" placeholder="Search any field..."><div class="clear"></div><img src="css/loader.gif" class="loader"><table id="outfit-list" class="no-style"></table></div>');

			var url = "https://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/outfit/?alias_lower="+alias+"&c:resolve=member_character(name,type,faction)&c:resolve=member_online_status&c:join=character^on:leader_character_id^to:character_id^inject_at:leader_character_id";
			url = url+"&callback=?";

			var member = [];

			$.getJSON(url, function(data){

				url2 = 'http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/characters_world/?character_id='+data.outfit_list[0].leader_character_id.character_id+'&c:join=world^on:world_id^to:world_id^inject_at:world&callback=?';

				$.getJSON(url2, function(data2){

					$('.loader').remove();

					if (data.outfit_list[0].leader_character_id.faction_id == 3){faction = 'Terran Republic'; faction_image = 'css/tr.png';}
					if (data.outfit_list[0].leader_character_id.faction_id == 1){faction = 'Vanu Sovereignty'; faction_image = 'css/vs.png';}
					if (data.outfit_list[0].leader_character_id.faction_id == 2){faction = 'New Conglomerate'; faction_image = 'css/nc.png';}

					$('.content').prepend('<img src="'+faction_image+'" class="faction-icon-outfit float-left"><h1 class="no-padding no-margin">['+alias.toUpperCase()+'] '+data.outfit_list[0].name+'</h1><span class="link">Leader: </span><a href="/'+data.outfit_list[0].leader_character_id.name.first+'" target="more">'+data.outfit_list[0].leader_character_id.name.first+'</a><br><span class="link">Members: </span>'+data.outfit_list[0].member_count+'<br><span class="link">Server: </span>'+data2.characters_world_list[0].world.name.en+'<br><a href="javascript:void(0)" class="float-right link" onClick="showOutfit();">[Get Stats]</a><a href="javascript:void(0)" class="float-right link" onClick="selectOnline();">[Select Online]</a><div class="clear"></div>');
					$('#outfit-list').append('<tr class="links"><td width="40%"><a href="javascript:void(0)" onclick="alphaSort(\'name\');" class="link small">Name</a></td><td width="30%" class="sort-outfit-rank"><a href="javascript:void(0)" onclick="alphaSort(\'rank\');" class="link small">Rank</a></td><td width="25%" class="sort-outfit-time"><a href="javascript:void(0)" onclick="alphaSort(\'time\');" class="link smalll">Member Since</a></td><td><a href="javascript:void(0)" onclick="alphaSort(\'online\');" class="link small">Status</a></td></tr>');

					for (var i=0; i < data.outfit_list[0].members.length; i++){

						if (data.outfit_list[0].members[i].online_status == 0){
							online = 'Offline';
						} else {
							online = '<font color="#2DDB24">ONLINE</font>';
						}

						if (typeof data.outfit_list[0].members[i].name != 'undefined'){
							$('#outfit-list').append('<tr id="'+data.outfit_list[0].members[i].name.first+'" onClick="select(\''+data.outfit_list[0].members[i].name.first+'\');" class="stat-card"><td class="font-ps2 sort-name">'+data.outfit_list[0].members[i].name.first+'</td><td class="sort-rank hidden">'+data.outfit_list[0].members[i].rank_ordinal+'</td><td class="font-normal">'+data.outfit_list[0].members[i].rank+'</td><td class="hidden sort-time">'+data.outfit_list[0].members[i].member_since+'</td><td class="font-normal">'+timeConverter(data.outfit_list[0].members[i].member_since, 'year')+'</td><td class="sort-online">'+online+'</td></tr>');
						}

					}

					$('.content').append('<div class="clear"></div><a href="javascript:void(0)" class="float-right link" onClick="showOutfit();">[Get Stats]</a><a href="javascript:void(0)" class="float-right link" onClick="selectOnline();">[Select Online]</a><br><br>');

					if ($(window).width() < 641){

						$('h1').css('font-size', '1.2em');
						$('.sort-outfit-rank').remove();
						$('.sort-outfit-time').remove();
						$('.sort-outfit-name').css({
							'width':'80%',
							'padding': '0.5em 0.7em 0.5em 0.7em',
							'font-size': '1.2em'
						});

					}

					alphaSort('rank');

				});

			});

		}

		function showOutfit(){

			var outfit_list = '';
			$('.selected').each(function(){
				outfit_list = outfit_list+$(this).attr('id')+',';
			});

			if (outfit_list.length < 1){
				alert('Please select 1 or more members to view their stats');
			} else {
				outfit_list = outfit_list.substring(0, outfit_list.length-1);
				window.location.href = 'http://planetstats.net/'+outfit_list;
			}
		}

		function getWeaponList(){

			$('html').css('background-image', 'url(css/ps2_3.jpg)');
			$('.wrapper').html('');

			$('.wrapper').prepend("<div class='over-header text-left bg-black'>PlanetStats.net | <a href='/' class='link'>Characters</a> | <a href='/weapons' class='link' id='weapon_link'>Weapons</a> | <a href='/data/weapons' class='link' id='weapon_link'>Weapon Data</a> | <a href='http://www.redbubble.com/people/l-33/collections/465010-planetside' target='redbubble' class='link'>Support the Site</a><a href='http://www.reddit.com/r/Planetside/comments/28b8j4/welcome_to_your_new_stat_trackercomparerwebapp/' class='link float-right'>[?]</a><form class='float-right' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_top'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='NY6SE74FJTL5A'><input type='image' src='https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='PayPal – The safer, easier way to pay online.'><img alt='' height='0px' border='0' src='https://www.paypalobjects.com/en_GB/i/scr/pixel.gif' width='1' height='1'></form></div><div class='header'><h1>PlanetStats.net</h1><p>Search and select any weapons below, and click 'Get Stats' to compare them</p></div>");
		//	$('.wrapper').append("<div class='content'><a href='javascript:void(0)' onClick='searchCards(\"terran\");'>TR</a> <a href='javascript:void(0)' onClick='searchCards(\"conglomerate\");'>NC</a> <a href='javascript:void(0)' onClick='searchCards(\"sovereignty\");'>VS</a> | <a href='javascript:void(0)' onClick='removeWeapons(\"cat=2\");'>Handheld</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=3\");'>Pistols</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=4\");'>Shotguns</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=5\");'>SMGs</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=6\");'>LMGs</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=7\");'>Assault Rifles</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=8\");'>Carbines</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=11\");'>Sniper Rifles (long)</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=12\");'>Sniper Rifles (mid)</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=13\");'>Rocket Launchers</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=14\");'>Chain Guns</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=17\");'>Grenades</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=18\");'>Explosives</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=19\");'>Scout Rifles</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=21\");'>MAX: Anti Vehicle</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=22\");'>MAX: Anti Infantry</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=23\");'>MAX: Anti Air</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=24\");'>Crossbows</a></div>");
			$('.wrapper').append('<div class="content"><span class="link">Filter / Search</span><div class="clear"></div><input type="text" id="search" class="no-padding" placeholder="Search any field. Use \'+\' to search two values, eg. terran+carbine"><div class="clear"></div><div class="float-left border-right padding-right"><a id="terran" href="javascript:void(0)" onClick="searchCards(\'terran\');" class="link">TR</a><br><a id="conglomerate" href="javascript:void(0)" onClick="searchCards(\'conglomerate\');" class="link">NC</a><br><a id="sovereignty" href="javascript:void(0)" onClick="searchCards(\'sovereignty\');" class="link">VS</a><br><a id="nanite" href="javascript:void(0)" onClick="searchCards(\'nanite\');" class="link">NS</a><br><br><a id="all" href="javascript:void(0)" onClick="searchCards(\'all\');" class="link">All</a></div><div class="col6 border-right"><a id="la" href="javascript:void(0)" onClick="searchCards(\'ccla\');" class="link">Light Assault</a><br><a id="la" href="javascript:void(0)" onClick="searchCards(\'ccha\');" class="link">Heavy Assault</a><br><a id="la" href="javascript:void(0)" onClick="searchCards(\'cccm\');" class="link">Combat Medic</a><br><a id="la" href="javascript:void(0)" onClick="searchCards(\'cce\');" class="link">Engineer</a><br><a id="la" href="javascript:void(0)" onClick="searchCards(\'cci\');" class="link">Infiltrator</a><br><a id="la" href="javascript:void(0)" onClick="searchCards(\'ccxm\');" class="link">MAX</a></div><div class="col6"><a href="javascript:void(0)" onClick="searchCards(\'assault\');" class="link">Assault Rifle</a><br><a href="javascript:void(0)" onClick="searchCards(\'battle\');" class="link">Battle Rifle</a><br><a href="javascript:void(0)" onClick="searchCards(\'carbine\');" class="link">Carbine</a><br><a href="javascript:void(0)" onClick="searchCards(\'heavy gun\');" class="link">Heavy Gun</a><br><a href="javascript:void(0)" onClick="searchCards(\'lmg\');" class="link">LMG</a></div><div class="col6 border-right"><a href="javascript:void(0)" onClick="searchCards(\'max\');" class="link">MAX</a><br><a href="javascript:void(0)" onClick="searchCards(\'rocket launcher\');" class="link">Rocket Launcher</a><br><a href="javascript:void(0)" onClick="searchCards(\'smg\');" class="link">SMG</a><br><a href="javascript:void(0)" onClick="searchCards(\'sniper\');" class="link">Sniper Rifle</a><br><a href="javascript:void(0)" onClick="searchCards(\'shotgun\');" class="link">Shotgun</a><br><br></div><div class="col6"><a href="javascript:void(0)" onClick="searchCards(\'flash pr\');" class="link">Flash</a><br><a href="javascript:void(0)" onClick="searchCards(\'harasser\');" class="link">Harasser</a><br><a href="javascript:void(0)" onClick="searchCards(\'sunderer\');" class="link">Sunderer</a><br><a href="javascript:void(0)" onClick="searchCards(\'lightning\');" class="link">Lightning</a><br><a href="javascript:void(0)" onClick="searchCards(\'liberator\');" class="link">Liberator</a><br><a href="javascript:void(0)" onClick="searchCards(\'valkyrie\');" class="link">Valkyrie</a></div><div class="col6"><a href="javascript:void(0)" onClick="searchCards(\'galaxy\');" class="link">Galaxy</a><br><a href="javascript:void(0)" onClick="searchCards(\'esf\');" class="link">ES Fighter</a><br><a href="javascript:void(0)" onClick="searchCards(\'mbt\');" class="link">ES Tank</a><br></div><br><br><span class="link">Results</span><div class="clear"></div><a href="javascript:void(0)" class="float-right link" onClick="getWeaponSelected();"> [Get Stats] </a> <a href="javascript:void(0)" class="float-right link" onClick="selectAll();"> [Select Listed] </a> <a href="javascript:void(0)" class="float-right link" onClick="showSelected();"> [Show Selected] </a> <a href="javascript:void(0)" class="float-right link" onClick="showAll();"> [Reset] </a><div class="clear"></div><table id="outfit-list" class="no-style"><tr><td width="30%"><a href="javascript:void(0)" onclick="alphaSort(\'name\');" class="link small">Name</a></td><td width="10%"><a href="javascript:void(0)" onclick="alphaSort(\'faction\');" class="link small">Faction</a></td><td><a href="javascript:void(0)" onclick="alphaSort(\'type\');" class="link small">Type</a></td><td width="15%" class="sort-outfit-time"><a href="javascript:void(0)" onclick="alphaSort(\'damage\');" class="link smalll">Damage</a></td><td width="15%"><a href="javascript:void(0)" onclick="alphaSort(\'range\');" class="link small">Range</a></td></tr></table><img src="css/loader.gif" class="loader"></div>');
			$('#all').css('color', '#fff');

			var url = "https://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/item/?item_type_id=26&c:show=item_type_id,item_id,name.en,faction_id,item_category_id&c:join=weapon_datasheet^on:item_id^to:item_id^show:damage'damage_max'range.en^inject_at:details&c:join=fire_mode^on:item_id^to:item_id^show:description.en%27damage^inject_at:fire_mode&c:join=item_category^on:item_category_id^to:item_category_id^inject_at:item_category&c:limit=1000&c:lang=en";
			url = url+"&callback=?";

			//var faction = getCookie('faction');
			var faction = '';
			$.getJSON(url, function(data){

				$('.loader').remove();

				for (var i=0; i < data.item_list.length; i++){

					if (typeof data.item_list[i].item_category != 'undefined' && data.item_list[i].item_category.name.en != 'Infantry Abilities'){

						if (data.item_list[i].faction_id == 3){
							faction_ab = 'tr'; faction = 'Terran Republic'; faction_image = 'css/tr.png';
						} else if (data.item_list[i].faction_id == 1){
							faction_ab = 'vs'; faction = 'Vanu Sovereignty'; faction_image = 'css/vs.png';
						} else if (data.item_list[i].faction_id == 2){
							faction_ab = 'nc'; faction = 'New Conglomerate'; faction_image = 'css/nc.png';
						} else {
							faction_ab = 'ns'; faction = 'Nanite Systems'; faction_image = 'css/ns.png';
						}

						var damage = '-';
						var range = '-';
						var type = '-';

						if (typeof data.item_list[i].item_category != 'undefined'){
							type = data.item_list[i].item_category.name.en;
						} else {
							continue;
						}

						if (data.item_list[i].details){

								if (data.item_list[i].details.damage){
									damage = data.item_list[i].details.damage;
								}

								var range = data.item_list[i].details.range.en;

						}


							if (typeof data.item_list[i].fire_mode != 'undefined' && data.item_list[i].fire_mode.damage){
								var damage = data.item_list[i].fire_mode.damage;
							} else if(typeof data.item_list[i].details != 'undefined') {
								var damage = data.item_list[i].details.damage;
							} else {
								var damage = '-';
							}


						if (type == 'Knife'){
							var w_class = 'ccla ccha cccm cce cci ccxm';
						} else if (type == 'Assault Rifle'){
							var w_class = 'cccm';
						} else if (type == 'LMG'){
							var w_class = 'ccha';
						} else if (type == 'Carbine'){
							var w_class = 'ccla cce';
						} else if (type == 'Heavy Weapon'){
							var w_class = 'ccha';
						} else if (type == 'Sniper Rifle'){
							var w_class = 'cci';
						} else if (type == 'Scout Rifle'){
							var w_class = 'cci';
						} else if (type == 'Shotgun'){
							var w_class = 'ccla ccha cccm cce';
						} else if (type == 'SMG'){
							var w_class = 'ccla ccha cccm cce cci';
						} else if (type == 'Pistol'){
							var w_class = 'ccla ccha cccm cce cci';
						} else if (type == 'Rocket Launcher'){
							var w_class = 'ccha';
						} else if (type == 'Battle Rifle'){
							var w_class = 'ccha cccm cce';
						} else if (type.match('MAX')){
							var w_class = 'ccxm'
						} else if (type.match('Mosquito') || type.match('Reaver') || type.match('Scythe')){
							var w_class = 'esf'
						} else if (type.match('Prowler') || type.match('Vanguard') || type.match('Magrider')){
							var w_class = 'mbt'
						} else {
							var w_class = '';
						}

					//	$('.content').prepend('<img src="'+faction_image+'" class="faction-icon-outfit float-left"><h1 class="no-padding no-margin">['+alias.toUpperCase()+'] '+data.outfit_list[0].name+'</h1><span class="link">Leader: </span><a href="/'+data.outfit_list[0].leader_character_id.name.first+'" target="more">'+data.outfit_list[0].leader_character_id.name.first+'</a><br><span class="link">Members: </span>'+data.outfit_list[0].member_count+'<br><span class="link">Server: </span>'+data2.characters_world_list[0].world.name.en+'<br><a href="javascript:void(0)" class="float-right link" onClick="showOutfit();">[Get Stats]</a><a href="javascript:void(0)" class="float-right link" onClick="selectOnline();">[Select Online]</a><div class="clear"></div>');
					//	$('#weapon-list').append('<tr><td width="40%"><a href="javascript:void(0)" onclick="alphaSort(\'name\');" class="link small">Name</a></td><td width="30%" class="sort-outfit-rank"><a href="javascript:void(0)" onclick="alphaSort(\'rank\');" class="link small">Rank</a></td><td width="25%" class="sort-outfit-time"><a href="javascript:void(0)" onclick="alphaSort(\'time\');" class="link smalll">Member Since</a></td><td><a href="javascript:void(0)" onclick="alphaSort(\'online\');" class="link small">Status</a></td></tr>');

						if (data.item_list[i].name){
							$('#outfit-list').append('<tr id="'+data.item_list[i].item_id+'" onClick="select(\''+data.item_list[i].item_id+'\');" class="stat-card dbclick"><td class="font-ps2 sort-name">'+data.item_list[i].name.en+'</td><td class="hidden">'+w_class+'</td><td class="hidden">'+faction+'</td><td class="font-normal sort-faction">'+faction_ab.toUpperCase()+'</td><td class="font-normal sort-type">'+type+'</td><td class="font-normal sort-damage">'+damage+'</td><td class="font-normal sort-range">'+range+'</td></tr>');
						}
					//	$('.content').append('<div class="clear"></div><br><br>');

						if ($(window).width() < 641){

							$('h1').css('font-size', '1.2em');
							$('.sort-outfit-rank').remove();
							$('.sort-outfit-time').remove();
							$('.sort-outfit-name').css({
								'width':'80%',
								'padding': '0.5em 0.7em 0.5em 0.7em',
								'font-size': '1.2em'
							});

						}

					//	// // console.log( data.item_list.length);
					}
				}

				//resolveWeapons(id);

			});


		}

		function getWeaponSelected(){

			var weapon_list = '';
			$('.selected').each(function(){
				weapon_list = weapon_list+$(this).attr('id')+',';
			});

			if (weapon_list.length < 1){
				alert('Please select 1 or more weapons to view the stats');
			} else {
				weapon_list = weapon_list.substring(0, weapon_list.length-1);
				window.location.href = '/'+weapon_list;
			}

		}

		function getWeapon(ids){

			// // console.log('Getting Weapons from IDs');

			$('html').css('background-image', 'url(css/ps2_6.jpg)');
			$('.wrapper').html('');
			$('.wrapper').prepend("<div class='over-header text-left bg-black'>PlanetStats.net | <a href='/' class='link'>Characters</a> | <a href='/weapons' class='link' id='weapon_link'>Weapons</a> | <a href='/data/weapons' class='link' id='weapon_link'>Weapon Data</a> | <a href='http://www.redbubble.com/people/l-33/collections/465010-planetside' target='redbubble' class='link'>Support the Site</a><a href='http://www.reddit.com/r/Planetside/comments/28b8j4/welcome_to_your_new_stat_trackercomparerwebapp/' class='link float-right'>[?]</a><form class='float-right' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_top'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='NY6SE74FJTL5A'><input type='image' src='https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='PayPal – The safer, easier way to pay online.'><img alt='' height='0px' border='0' src='https://www.paypalobjects.com/en_GB/i/scr/pixel.gif' width='1' height='1'></form></div>");
		//	$('.wrapper').append("<a href='javascript:void(0)' onClick='removeWeapons(\"tr\");'>TR</a> <a href='javascript:void(0)' onClick='removeWeapons(\"nc\");'>NC</a> <a href='javascript:void(0)' onClick='removeWeapons(\"vs\");'>VS</a> | <a href='javascript:void(0)' onClick='removeWeapons(\"cat=2\");'>Handheld</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=3\");'>Pistols</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=4\");'>Shotguns</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=5\");'>SMGs</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=6\");'>LMGs</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=7\");'>Assault Rifles</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=8\");'>Carbines</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=11\");'>Sniper Rifles (long)</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=12\");'>Sniper Rifles (mid)</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=13\");'>Rocket Launchers</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=14\");'>Chain Guns</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=17\");'>Grenades</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=18\");'>Explosives</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=19\");'>Scout Rifles</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=21\");'>MAX: Anti Vehicle</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=22\");'>MAX: Anti Infantry</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=23\");'>MAX: Anti Air</a> <a href='javascript:void(0)' onClick='removeWeapons(\"cat=24\");'>Crossbows</a><div class='clear'></div><img src='css/loader.gif' class='loader'>");
			$('.wrapper').append('<div class="content-wrap"></div>');

			var url = "https://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/item/?item_id="+ids;
			url = url+"&callback=?";

			//var faction = getCookie('faction');
			var faction = '';
			$.getJSON(url, function(data){

				$('.loader').remove();

				for (var i=0; i < data.item_list.length; i++){

				// // console.log('Creating stat card for item_id='+data.item_list[i].item_id+' Count='+i);

					if (faction){
						if (faction == data.item_list[i].faction_id){
							$('.content-wrap').append('<div id="'+data.item_list[i].item_id+'" class="content stat-card"></div>');
							$('#'+data.item_list[i].item_id).load('weaponcard.php?id='+data.item_list[i].item_id);
						}
					} else {
						$('.content-wrap').append('<div id="'+data.item_list[i].item_id+'" class="content stat-card"></div>');
						$('#'+data.item_list[i].item_id).load('weaponcard.php?id='+data.item_list[i].item_id);
					}

				}

				var single = $('.stat-card').length;
				if ($(window).width() < 1026 && $(window).width() > 640 && single > 1 || $(window).width() > 1025 && single == 2){

					$('.content').css({
						'float':'left',
						'width': '49%',
						'margin': '0.5%'
					});

				} else if ($(window).width() > 1025 && single > 2){


					$('.content').css({
						'float':'left',
						'width': '32%',
						'margin': '0.5%'
					});


				} else if ($(window).width() < 641){

					$('.content').css({
						'width': '100%'
					});
					$('.fold h1').css({
						'font-size': '2em'
					});
					$('.fold .col2').css({
						'width': '100%'
					});

				}

				resolveWeapons();

			});

		}

		function resolveWeapons(){

			// // console.log('Resolving Weapons');

			var ids = '';
			var id_cnt = 0;

			$('.stat-card').each(function(){
				ids = ids+','+$(this).attr('id');
				id_cnt++;
			});
			ids = ids.replace(',add','').substring(1);

			max_stat_muzzle = 0;
			max_stat_cap = 0;
			max_stat_damage = 0;
			max_stat_cone = 0;
			max_stat_rate = 0;
			max_stat_range = 0;
			max_stat_reload = 999;
			max_stat_ttk = 999;
			max_stat_ttkp = 999;
			max_stat_equip = 0;
			max_stat_speed = 0;

			max_muzzle = '';
			max_cap = '';
			max_damage = '';
			max_cone = '';
			max_rate = '';
			max_range = '';
			max_reload = '';
			max_ttk = '';
			max_ttkp = '';
			max_equip = '';
			max_speed = '';
			fire_cone = [];

			velocity = 500;

			var url = "https://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/item/?item_id="+ids+"&c:join=weapon_datasheet^on:item_id^to:item_id^inject_at:details&c:join=fire_mode^on:item_id^to:item_id^inject_at:fire_mode&c:join=item_category^on:item_category_id^to:item_category_id^inject_at:item_category";
			url = url+"&callback=?";

			$.getJSON(url, function(data){

				// // console.log('Looping JSON '+data.item_list.length);
				for (var i=0; i < data.item_list.length; i++){

					cnt = i+1;
					// // console.log('Getting 1st stats for item_id='+data.item_list[i].item_id+' Count='+cnt+' of '+data.item_list.length);

					var id = data.item_list[i].item_id;
					faction_image = '';

					if (data.item_list[i].faction_id == 3){
						faction = 'Terran Republic'; faction_image = 'css/tr.png';
					} else if (data.item_list[i].faction_id == 1){
						faction = 'Vanu Sovereignty'; faction_image = 'css/vs.png';
					} else if (data.item_list[i].faction_id == 2){
						faction = 'New Conglomerate'; faction_image = 'css/nc.png';
					} else {
						faction = 'Nanite Systems'; faction_image = 'css/ns.png';
					}

					$('#faction-image-'+id).attr('src', faction_image);
					$('#cat-'+id).text(data.item_list[i].item_category_id);

					if (data.item_list[i].image_path){
						$('#weapon-img-'+id).attr('src', 'http://census.daybreakgames.com/'+data.item_list[i].image_path);
					}

				//	if (data.item_list[i].name){

						$('#name-'+id).text(data.item_list[i].name.en);


						if (data.item_list[i].fire_mode){
							$('#proj-desc-'+id).text(data.item_list[i].item_category.name.en);
							if (data.item_list[i].fire_mode.description){
							//	$('#mode-'+id).text('['+data.item_list[i].fire_mode.description.en+']');
							} else {
							//	$('#mode-'+id).text('');
							}

							if (data.item_list[i].fire_mode.muzzle_velocity){
								$('#muzzle-'+id).text(data.item_list[i].fire_mode.muzzle_velocity);
								var stat_muzzle = ((data.item_list[i].fire_mode.muzzle_velocity/1000)*100).toFixed(0);
								velocity = data.item_list[i].fire_mode.muzzle_velocity;
							} else if (data.item_list[i].fire_mode.max_speed) {
								$('#muzzle-'+id).text(data.item_list[i].fire_mode.max_speed);
								var stat_muzzle = ((data.item_list[i].fire_mode.max_speed/1000)*100).toFixed(0);
								velocity = data.item_list[i].fire_mode.max_speed;
							} else {
								$('#muzzle-'+id).text(data.item_list[i].fire_mode.speed);
								var stat_muzzle = ((data.item_list[i].fire_mode.speed/1000)*100).toFixed(0);
								velocity = data.item_list[i].fire_mode.speed;
							}


							$('#stat-muzzle-'+id).animate({'width': stat_muzzle+'%'});

							if (stat_muzzle > max_stat_muzzle){
								var max_muzzle = id;
								max_stat_muzzle = stat_muzzle;
							}

							if (data.item_list[i].fire_mode.damage){
								var damage = data.item_list[i].fire_mode.damage;
							} else {
								var damage = data.item_list[i].fire_mode.damage_max;
							}

							if (data.item_list[i].fire_mode.pellets_per_shot){
								var pellets = data.item_list[i].fire_mode.pellets_per_shot;
							} else {
								var pellets = 1;
							}

							var speed = parseFloat(data.item_list[i].fire_mode.cof_recoil);
							$('#speed-'+id).text(speed.toFixed(2));
							stat_speed = (speed/3)*100;
							$('#stat-speed-'+id).animate({'width': stat_speed+'%'});

							if (stat_speed > max_stat_speed){
								var max_speed = id;
								max_stat_speed = stat_speed;
							}

							var dg_height = $('#damage-graph-'+id).height();

							if (parseInt(data.item_list[i].fire_mode.damage_max_range) > 380){

								var dg_width = $('#damage-graph-'+id).width();
								var cells = 30;
								dg_cell_width = parseInt(dg_width/cells);


								for (var ii = 0; ii <= cells; ii++){
									$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="'+ii*dg_cell_width+'px" y1="0%" x2="'+ii*dg_cell_width+'px" y2="100%" style="stroke: rgba(33,95,100,0.5);stroke-width:1"></svg>');
								}

								for (var ii = 0; ii <= cells-1; ii++){
									$('#damage-axis-'+id).append('<div style="width: '+dg_cell_width+'px;" class="x-axis">'+ii*20+'</div>');
								}

							//	var y1 = 100-((data.item_list[i].fire_mode.damage_max/1000)*100);
							//	var y2 = 100-((data.item_list[i].fire_mode.damage_min/1000)*100);
							//	var y1a = y1-20;
							//	var y2a = y2-20;

								var x1 = (data.item_list[i].fire_mode.damage_max_range/615)*100;
								var x2 = (data.item_list[i].fire_mode.damage_min_range/615)*100;
								var dam_max_val = data.item_list[i].fire_mode.damage_max;
								var dam_min_val = data.item_list[i].fire_mode.damage_min;

								x2a = x2;
								if (x2 > 330){
									x2a = 330;
								}

								y1 = 20;
								y2 = 80;
								y1a = 0;
								y2a = 60;

								var damage_dropoff = 1;

								if (data.item_list[i].fire_mode.damage_radius > 0){
									var dam_radius = (data.item_list[i].fire_mode.damage_radius/615)*100;
									dam_radius = (dg_width/100)*dam_radius;
									$('#damage-graph-'+id).append('<svg height="100%" width="100%"><defs><radialGradient id="myRadialGradient3" fx="5%" fy="5%" r="65%" spreadMethod="pad"> <stop offset="0%"   stop-color="#FFE58E" stop-opacity="0.7"/> <stop offset="100%" stop-color="#FFC300" stop-opacity="0.1" /></radialGradient> </defs><circle cx="0" cy="50%" r="'+dam_radius+'px" style="fill: url(#myRadialGradient3);"></svg>');
								}


							} else if (data.item_list[i].fire_mode.damage_max_range){

								var dg_width = $('#damage-graph-'+id).width();
								var cells = 20;
								dg_cell_width = parseInt(dg_width/cells);


								for (var ii = 0; ii <= cells; ii++){
									$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="'+ii*dg_cell_width+'px" y1="0%" x2="'+ii*dg_cell_width+'px" y2="100%" style="stroke: rgba(33,95,100,0.5);stroke-width:1"></svg>');
								}

								for (var ii = 0; ii <= cells-1; ii++){
									$('#damage-axis-'+id).append('<div style="width: '+dg_cell_width+'px;" class="x-axis">'+ii*20+'</div>');
								}

							//	var y1 = 100-((data.item_list[i].fire_mode.damage_max/1000)*100);
							//	var y2 = 100-((data.item_list[i].fire_mode.damage_min/1000)*100);

								var x1 = (data.item_list[i].fire_mode.damage_max_range/402)*100;
								var x2 = (data.item_list[i].fire_mode.damage_min_range/402)*100;
								var dam_max_val = data.item_list[i].fire_mode.damage_max;
								var dam_min_val = data.item_list[i].fire_mode.damage_min;


								y1 = 20;
								y2 = 80;
								y1a = 0;
								y2a = 60;

								var y1a = y1-18;
								var y2a = y2-18;
								x2a = x2;
								if (x2 > 330){
									x2a = 330;
								}

								var damage_dropoff = 1;

								if (data.item_list[i].fire_mode.damage_radius > 0){
									var dam_radius = (data.item_list[i].fire_mode.damage_radius/402)*100;
									dam_radius = (dg_width/100)*dam_radius;
									$('#damage-graph-'+id).append('<svg height="100%" width="100%"><defs><radialGradient id="myRadialGradient3" fx="5%" fy="5%" r="65%" spreadMethod="pad"> <stop offset="0%"   stop-color="#FFE58E" stop-opacity="0.7"/> <stop offset="100%" stop-color="#FFC300" stop-opacity="0.1" /></radialGradient> </defs><circle cx="0" cy="50%" r="'+dam_radius+'px" style="fill: url(#myRadialGradient3);"></svg>');
								}

								if (data.item_list[i].details){

									fire_cone[id] = data.item_list[i].details.fire_cone;

								}

							} else {

								var dg_width = $('#damage-graph-'+id).width();
								var cells = 2;
								dg_cell_width = parseInt(dg_width/cells);


								for (var ii = 0; ii <= cells+5; ii++){
									$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="'+ii*dg_cell_width/4+'px" y1="0%" x2="'+ii*dg_cell_width/4+'px" y2="100%" style="stroke: rgba(33,95,100,0.5);stroke-width:1"></svg>');
								}

								for (var ii = 0; ii <= cells+5; ii++){
									$('#damage-axis-'+id).append('<div style="width: '+dg_cell_width/4+'px;" class="x-axis">'+ii*5+'</div>');
								}

							//	var y1 = 100-((data.item_list[i].fire_mode.damage_max/1000)*100);
							//	var y2 = 100-((data.item_list[i].fire_mode.damage_min/1000)*100);

								var dam_max_val = data.item_list[i].fire_mode.damage;
								var dam_min_val = data.item_list[i].fire_mode.damage;
								var x1 = 2;
								var x2 = 2;

								y1 = 100-((data.item_list[i].fire_mode.damage/1600)*100);
								if (y1 < 20){y1 = 20;}
								y2 = y1;
								y1a = 60;
								y2a = 60;

								var y1a = y1-18;
								var y2a = y2-18;
								x2a = x2;
								if (x2 > 330){
									x2a = 330;
								}

								var damage_dropoff = 0;

								if (data.item_list[i].fire_mode.damage_radius > 0){
									var dam_radius = (data.item_list[i].fire_mode.damage_radius/40)*100;
									dam_radius = (dg_width/100)*dam_radius;
									$('#damage-graph-'+id).append('<svg height="100%" width="100%"><defs><radialGradient id="myRadialGradient3" fx="5%" fy="5%" r="65%" spreadMethod="pad"> <stop offset="0%"   stop-color="#FFE58E" stop-opacity="0.7"/> <stop offset="100%" stop-color="#FFC300" stop-opacity="0.1" /></radialGradient> </defs><circle cx="0" cy="50%" r="'+dam_radius+'px" style="fill: url(#myRadialGradient3);"></svg>');
								}
							}



							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="0%" y1="'+y1+'%" x2="'+x1+'%" y2="'+y1+'%" style="stroke: #56BABA;stroke-width:2"></svg>');
							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="'+x1+'%" y1="'+y1+'%" x2="'+x2+'%" y2="'+y2+'%" style="stroke: #56BABA;stroke-width:2"></svg>');
							$('#damage-graph-'+id).append('<svg height="100%" width="100%"><line x1="'+x2+'%" y1="'+y2+'%" x2="100%" y2="'+y2+'%" style="stroke: #56BABA;stroke-width:2"></svg>');
							$('#damage-graph-'+id).append('<div class="plot-point" id="damage-max-'+id+'" style="top: '+y1a+'%; left: '+x1+'%;">'+dam_max_val +'</div>');
							$('#damage-graph-'+id).append('<div class="plot-point" id="damage-min-'+id+'" style="top: '+y2a+'%; left: '+x2a+'%;">'+dam_min_val +'</div>');

						}

						if (typeof data.item_list[i].details != 'undefined'){

							$('#cap-'+id).text(data.item_list[i].details.capacity);
							$('#clip-'+id).text(data.item_list[i].details.clip_size);
							stat_cap = ((data.item_list[i].details.clip_size/125)*100).toFixed(0);

							$('#stat-cap-'+id).animate({'width': stat_cap+'%'});

							if (parseInt(data.item_list[i].details.clip_size) >= max_stat_cap){
								max_cap = id;
								max_stat_cap = data.item_list[i].details.clip_size;
							}

							if (pellets > 1){
								damage_txt = ' x'+pellets;
								damage_tot = damage*pellets;
							} else {
								damage_txt = '';
								damage_tot = damage;
							}

							$('#damage-'+id).text(damage+damage_txt);

							if (damage_dropoff == 1){
								$('#damage-clip-'+id).text(damage_tot*data.item_list[i].details.clip_size);
							} else {
								$('#title-damage-'+id).text('Damage / Indirect');
								$('#damage-clip-'+id).text(data.item_list[i].details.indirect_damage);
							}

							var stat_damage = ((damage_tot/1500)*100).toFixed(0);
							$('#stat-damage-'+id).animate({'width': stat_damage+'%'});

							if (damage_tot >= max_stat_damage){
								max_damage = id;
								max_stat_damage = damage_tot;
							}


							fire_rate = 60/(data.item_list[i].details.fire_rate_ms/1000);
							if (data.item_list[i].details.clip_size == 1){
								fire_rate = 60/((parseInt(data.item_list[i].details.fire_rate_ms)+parseInt(data.item_list[i].details.reload_ms))/1000);
							}
							$('#rate-'+id).text(fire_rate.toFixed(0));

							var stat_rate = ((fire_rate.toFixed(0)/1000)*100).toFixed(0);
							$('#stat-rate-'+id).animate({'width': stat_rate+'%'});

							if (stat_rate >= max_stat_rate){
								max_rate = id;
								max_stat_rate = stat_rate;
							}

							var dps_max = (parseInt(dam_max_val)*(fire_rate/60)).toFixed(0);
							var dps_min = (parseInt(dam_min_val)*(fire_rate/60)).toFixed(0);
							$('#damage-max-'+id).append(' / '+dps_max+' DPS');
							$('#damage-min-'+id).append(' / '+dps_min+' DPS');

							var s_reload = (data.item_list[i].details.reload_ms/1000).toFixed(1);
							$('#reload-'+id).text(s_reload);
							var reload = ((data.item_list[i].fire_mode.reload_time_ms/1000+data.item_list[i].fire_mode.reload_chamber_time_ms/1000)).toFixed(1);
							$('#reload-s-'+id).text(reload);

							var stat_reload = ((reload/10)*100).toFixed(0);
						//	stat_reload = 100-stat_reload;
							$('#stat-reload-'+id).animate({'width': stat_reload+'%'});

							if (stat_reload <= max_stat_reload){
								max_reload = id;
								max_stat_reload = stat_reload;
							}

							var avg_dam = (parseInt(dam_min_val)+parseInt(dam_max_val))/2;

							var btkmn = (1000/dam_max_val);
							var btkmd = (1000/avg_dam);
							var btkmx = (1000/dam_min_val);

							if (pellets > 1){
								fire_rate = fire_rate/pellets;
								btkmn = btkmn/pellets;
								btkmd = btkmd/pellets;
								btkmx = btkmx/pellets;

							}

							btkmn = Math.ceil(btkmn);
							btkmd = Math.ceil(btkmd);
							btkmx = Math.ceil(btkmx);

							var ttkmn = (btkmn-1)/(fire_rate/60);
							var ttkmd = (btkmd-1)/(fire_rate/60);
							var ttkmx = (btkmx-1)/(fire_rate/60);

						//	if (typeof data.item_list[i].fire_mode.damage != 'undefined'){
						//		var travel = data.item_list[i].fire_mode.damage;
						//	} else {

						//	}

							var travel = travel/velocity;

							$('#ttkstats-'+id).attr('dam_max_val',dam_max_val).attr('avg_dam',avg_dam).attr('dam_min_val',dam_min_val).attr('fire_rate',fire_rate).attr('pellets',pellets).attr('min_range',data.item_list[i].fire_mode.damage_min_range).attr('max_range',data.item_list[i].fire_mode.damage_max_range).attr('velocity',velocity).attr('clip',data.item_list[i].details.clip_size).attr('reload',s_reload);

							//$('#ttk-shot-'+id).text(ttkmn.toFixed(2));
							$('#ttk-'+id).text(ttkmn.toFixed(2));
							$('#ttk-shot-'+id).text(btkmn.toFixed(0)+' Shots');
							$('#ttkmd-'+id).text(ttkmd.toFixed(2));
							$('#ttkmd-shot-'+id).text(btkmd.toFixed(0)+' Shots');
							$('#ttkmx-'+id).text(ttkmx.toFixed(2));
							$('#ttkmx-shot-'+id).text(btkmx.toFixed(0)+' Shots');
						//	$('#ttkp-'+id).text(ttkrl.toFixed(2));
						//	$('#ttkp-shot-'+id).text(btkrl.toFixed(0)+' Shots'+clip_txt);


							check(id+'-init');

							var stat_ttk = (((ttkmx.toFixed(2)*100)/600)*100).toFixed(0);
							//stat_ttk = 100-stat_ttk;
							$('#stat-ttk-'+id).animate({'width': stat_ttk+'%'});
							// // console.log(stat_ttk);
							if (stat_ttk <= max_stat_ttk){
								max_ttk = id;
								max_stat_ttk = stat_ttk;
							}

							var stat_ttkp = (((ttkmn.toFixed(2)*100)/600)*100).toFixed(0);
							//stat_ttk = 100-stat_ttk;
							$('#stat-ttkp-'+id).animate({'width': stat_ttkp+'%'});
							// // console.log(stat_ttk);
							if (stat_ttkp <= max_stat_ttkp){
								max_ttkp = id;
								max_stat_ttkp = stat_ttkp;
							}
						}

						if (data.item_list[i].description){
							$('#more-'+id).text(data.item_list[i].description.en);
						}


					//} else {

					//	$('#'+id).remove();

					//}

					getAddWeaponStats(data.item_list[i].item_id);
					$('#damage-graph-'+id).append('<svg height="100%" width="100%"><circle cx="50%" cy="50%" r="5px" stroke="rgba(33,95,100,0.5)" stroke-width="2" fill="none"></svg><svg height="100%" width="100%"><circle cx="50%" cy="50%" r="20px" stroke="rgba(33,95,100,0.5)" stroke-width="2" fill="none"></svg><svg height="100%" width="100%"><circle cx="50%" cy="50%" r="35px" stroke="rgba(33,95,100,0.5)" stroke-width="2" fill="none"></svg><svg height="100%" width="100%"><circle cx="50%" cy="50%" r="50px" stroke="rgba(33,95,100,0.5)" stroke-width="2" fill="none"></svg>');

				}

				$('#stat-cap-'+max_cap).css('background', 'rgba(52,144,151,0.6)');
				$('#stat-damage-'+max_damage).css('background', 'rgba(52,144,151,0.6)');
				$('#stat-reload-'+max_reload).css('background', 'rgba(52,144,151,0.6)');
				$('#stat-rate-'+max_rate).css('background', 'rgba(52,144,151,0.6)');
				$('#stat-muzzle-'+max_muzzle).css('background', 'rgba(52,144,151,0.6)');
				$('#stat-ttk-'+max_ttk).css('background', 'rgba(52,144,151,0.6)');
				$('#stat-ttkp-'+max_ttkp).css('background', 'rgba(52,144,151,0.6)');
			//	$('#stat-equip-'+max_equip).css('background', 'rgba(52,144,151,0.6)');


				$('input[type=checkbox]').each(function(){
					label = $(this).attr('label');
					var id = $(this).parent().parent().parent().attr('id').replace('ttkmore-','');
					if (label != ""){

						var label_id = id+'-'+label.replace(/ /g,'-').replace('%','');
						$(this).attr('id', label_id);

						$(this).addClass('styled');
						$(this).after('<label onclick="check(\''+label_id+'\');">'+label+'</label>');


					}
				});

			});

		}

		function check(id){

			var weapon_id = id.split('-')[0];

			if (id.match(/Accuracy/)){
				$('#'+weapon_id+'-10-Accuracy').prop('checked', false);
				$('#'+weapon_id+'-20-Accuracy').prop('checked', false);
				$('#'+weapon_id+'-40-Accuracy').prop('checked', false);
				$('#'+weapon_id+'-75-Accuracy').prop('checked', false);
				$('#'+weapon_id+'-100-Accuracy').prop('checked', false);
			}

			if (id.match(/Nanoweave/) || id.match(/Shield/)){
				$('#'+weapon_id+'-Tier1-Nanoweave').prop('checked', false);
				$('#'+weapon_id+'-Tier2-Nanoweave').prop('checked', false);
				$('#'+weapon_id+'-Tier3-Nanoweave').prop('checked', false);
				$('#'+weapon_id+'-Tier4-Nanoweave').prop('checked', false);
				$('#'+weapon_id+'-Tier5-Nanoweave').prop('checked', false);
				$('#'+weapon_id+'-Resist-Shield').prop('checked', false);
			}

			if (id.match(/Shield/)){
				$('#'+weapon_id+'-Nanite-Mesh').prop('checked', false);
			}

			if (id.match(/Mesh/)){
				$('#'+weapon_id+'-Resist-Shield').prop('checked', false);
			}

			if (id.match(/Range/)){
				$('#'+weapon_id+'-Min-Range').prop('checked', false);
				$('#'+weapon_id+'-Med-Range').prop('checked', false);
				$('#'+weapon_id+'-Max-Range').prop('checked', false);
			}

			if (id.match(/HSR/)){
				$('#'+weapon_id+'-0-HSR').prop('checked', false);
				$('#'+weapon_id+'-20-HSR').prop('checked', false);
				$('#'+weapon_id+'-100-HSR').prop('checked', false);
			}

			if ($('#'+id).is(':checked') === false && prev_id != id){
				$('#'+id).prop('checked', true);
				prev_id = id;

			} else {
				$('#'+id).prop('checked', false);
				prev_id = '';
			}

			if ($('#'+weapon_id+'-10-Accuracy').is(':checked') === false && $('#'+weapon_id+'-20-Accuracy').is(':checked') === false && $('#'+weapon_id+'-40-Accuracy').is(':checked') === false && $('#'+weapon_id+'-75-Accuracy').is(':checked') === false && $('#'+weapon_id+'-100-Accuracy').is(':checked') === false){
				$('#'+weapon_id+'-100-Accuracy').prop('checked', true);
			}

			if ($('#'+weapon_id+'-Min-Range').is(':checked') === false && $('#'+weapon_id+'-Med-Range').is(':checked') === false && $('#'+weapon_id+'-Max-Range').is(':checked') === false){
				$('#'+weapon_id+'-Med-Range').prop('checked', true);
			}

			var pellets = parseFloat($('#ttkstats-'+weapon_id).attr('pellets'));
			var damage = parseFloat($('#ttkstats-'+weapon_id).attr('avg_dam'));
			var damage_pure = parseFloat($('#ttkstats-'+weapon_id).attr('avg_dam'));
			var fire_rate = parseFloat($('#ttkstats-'+weapon_id).attr('fire_rate'));
			var min_range = parseFloat($('#ttkstats-'+weapon_id).attr('max_range'));
			var max_range = parseFloat($('#ttkstats-'+weapon_id).attr('min_range'));
			var velocity = parseFloat($('#ttkstats-'+weapon_id).attr('velocity'));
			var acc = 100;
			var health = 1000;
			var travel = (parseInt(max_range)+parseInt(min_range))/2;
			var clip_txt = '';
			travel = travel/velocity;

			if ($('#'+weapon_id+'-Nanite-Mesh').is(':checked') === true){
				//health = health+700;
			}

			if ($('#'+weapon_id+'-Min-Range').is(':checked') === true){
				damage = parseFloat($('#ttkstats-'+weapon_id).attr('dam_max_val'));
				damage_pure = parseFloat($('#ttkstats-'+weapon_id).attr('dam_max_val'));
				travel = min_range/velocity;
			}

			if ($('#'+weapon_id+'-Med-Range').is(':checked') === true){
				damage = parseFloat($('#ttkstats-'+weapon_id).attr('avg_dam'));
			}

			if ($('#'+weapon_id+'-Max-Range').is(':checked') === true){
				damage = parseFloat($('#ttkstats-'+weapon_id).attr('dam_min_val'));
				damage_pure = parseFloat($('#ttkstats-'+weapon_id).attr('dam_max_val'));
				travel = max_range/velocity;
			}

			if ($('#'+weapon_id+'-100-HSR').is(':checked') === true){
				damage = damage*2; //100% HSR
			}

			if ($('#'+weapon_id+'-Resist-Shield').is(':checked') === true){
				damage = damage*0.55;
			}

			if ($('#'+weapon_id+'-Tier1-Nanoweave').is(':checked') === true){
				perc = 1-0.075;
				damage = damage*perc;
			}

			if ($('#'+weapon_id+'-Tier2-Nanoweave').is(':checked') === true){
				perc = 1-0.10;
				damage = damage*perc;
			}

			if ($('#'+weapon_id+'-Tier3-Nanoweave').is(':checked') === true){
				perc = 1-0.12;
				damage = damage*perc;
			}

			if ($('#'+weapon_id+'-Tier4-Nanoweave').is(':checked') === true){
				perc = 1-0.15;
				damage = damage*perc;
			}

			if ($('#'+weapon_id+'-Tier5-Nanoweave').is(':checked') === true){
				perc = 1-0.20;
				damage = damage*perc;
			}

			if ($('#'+weapon_id+'-10-Accuracy').is(':checked') === true){
				var acc = 10;
			}

			if ($('#'+weapon_id+'-20-Accuracy').is(':checked') === true){
				var acc = 20;
			}

			if ($('#'+weapon_id+'-40-Accuracy').is(':checked') === true){
				var acc = 40;
			}

			if ($('#'+weapon_id+'-75-Accuracy').is(':checked') === true){
				var acc = 75;
			}

			if ($('#'+weapon_id+'-100-Accuracy').is(':checked') === true){
				var acc = 100;
			}

			if (id.match(/init/)){
				perc = 1-0.12;
				damage = damage*perc;
				acc = 40;
			}

			var btk_full_damage = 0;
			var btkrl = health/damage;

			if ($('#'+weapon_id+'-Nanite-Mesh').is(':checked') === true){
				btk_full_damage = 700/damage_pure;

			}
			console.log(btkrl+' '+btk_full_damage);
			btkrl = Math.ceil(btkrl)+Math.ceil(btk_full_damage);
			console.log(btkrl);
			if (pellets > 1){
			//	fire_rate = fire_rate/pellets;
				btkrl = btkrl/pellets;
				btkrl = Math.ceil(btkrl);
			}

			if ($('#'+weapon_id+'-20-HSR').is(':checked') === true || id.match(/init/)){
				hsb = (btkrl/100)*20;
				hsb = Math.ceil(hsb);
				hsb_damage = hsb*(damage*2);
				hsb_damage = hsb_damage.toFixed(0);
				btkrl = ((health-hsb_damage)/damage)+Math.ceil(btk_full_damage);
			//	console.log(btkrl);
			//	btkrl = Math.ceil(btkrl);
				btkrl = btkrl+hsb;
				clip_txt = '<br>'+hsb+' Headshots ('+hsb_damage+')';
			//	console.log(hsb+' '+(health-hsb_damage)+' '+hsb_damage+' '+btkrl);
			}
			console.log(btkrl);
			btkrl = btkrl*(100/acc); // accuracy

			if (btkrl < 1){
				btkrl = 1;
			}
			btkrl = Math.ceil(btkrl);
			console.log(btkrl);
			if ($('#'+weapon_id+'-Bullet-Travel').is(':checked') === false && !id.match(/init/)){
				travel = 0;
			}

			var clip = parseFloat($('#ttkstats-'+weapon_id).attr('clip'));
			var reload = parseFloat($('#ttkstats-'+weapon_id).attr('reload'));
			var rl_time = 0;

			btkrl_real = Math.floor(btkrl);

			var ctk = btkrl_real/clip;


			if (ctk > 1){
				ctk=Math.floor(ctk);
			//	console.log(ctk);
				rl_time = reload*ctk;
			//	rl_time = rl_time.toFixed(1);
				if (ctk > 1){
					clip_txt = clip_txt+'<br>+'+ctk+' Reloads ('+rl_time.toFixed(1)+'s)';
				} else {
					clip_txt = clip_txt+'<br>+'+ctk+' Reload ('+rl_time.toFixed(1)+'s)';
				}
			};

			var ttkrl = ((btkrl-1)/(fire_rate/60))+travel+rl_time;
			ttkrl = ttkrl.toFixed(2);

			$('#ttkp-'+weapon_id).html(ttkrl);
			$('#ttkp-shot-'+weapon_id).html(btkrl+' Shots'+clip_txt);

		}

		function removeWeapons(opt){

			var q_f = getCookie('query_faction');
			var q_c = getCookie('query_cat');

			if (opt == 'tr' || opt == 'vs' || opt == 'nc' && q_c !=''){

				setCookie('query_faction', opt);

				var reg = new RegExp(opt, "g");
				$('.stat-card').each(function(){
					var faction = $(this).children('.faction-icon').attr('src');
					var cat_id = $(this).children('.cat').text();

					if (faction == ''){

					} else {
						if (faction.match(reg) && cat_id == q_c || faction.match(/ns/) && cat_id == q_c){
							$(this).show();
						} else {
							$(this).hide();
						}
					}

				});


			} else if (opt == 'tr' || opt == 'vs' || opt == 'nc' || opt == 'ns'){

				// // console.log('faction');

				setCookie('query_faction', opt);

				var reg = new RegExp(opt, "g");
				$('.stat-card').each(function(){
					var faction = $(this).children('.faction-icon').attr('src');

					if (faction == ''){

					} else {
						if (faction.match(reg)){
							$(this).show();
						} else {
							$(this).hide();
						}
					}

				});

			} else if (opt.match(/cat/) && q_f != ''){

				// // console.log('cat+faction');

				var cat = opt.split('=')[1];

				setCookie('query_cat', cat);
				var reg = new RegExp(q_f, "g");

				$('.stat-card').each(function(){
					var cat_id = $(this).children('.cat').text();
					var faction = $(this).children('.faction-icon').attr('src');

					if (cat_id == cat && faction.match(reg) || cat_id == cat && faction.match(/ns/)){
						$(this).show();
					} else {
						$(this).hide();
					}

				});

			} else if (opt.match(/cat/)){
			// // console.log('cat');

				var cat = opt.split('=')[1];

				setCookie('query_cat', cat);

				$('.stat-card').each(function(){
					var cat_id = $(this).children('.cat').text();

					if (cat_id == cat){
						$(this).show();
					} else {
						$(this).hide();
					}

				});

			}

		}

		function remWeapon(id){
			$('#'+id).hide();
		}

		function getAttachments(id){

			$('#att-'+id).toggle();
			$('#att-'+id).html('<img src="css/loader.gif" class="loader">');
			var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/item_attachment/?item_id="+id+"&c:join=item^on:attachment_item_id^to:item_id^inject_at:attachment&c:limit=50";
			url = url+"&callback=?";

			$.getJSON(url, function(data){
				$('#att-'+id).html('');
				for (var i=0;i<data.item_attachment_list.length;i++){

					var att_name = data.item_attachment_list[i].attachment.name.en;
					if (!att_name.match(/default/gi)){
						$('#att-'+id).append('<div class="attachment" title="'+att_name+'" onClick="getAttInfo(\''+data.item_attachment_list[i].attachment_item_id+'\',\''+id+'\');"><img src="http://census.daybreakgames.com'+data.item_attachment_list[i].attachment.image_path+'"></div>');
					}

				}

				if (data.item_attachment_list.length < 3){
					$('#att-'+id).text('No Attachments available for this weapon');
				} else {
					$('#att-'+id).append('<div id="att-info-'+id+'"></div>');
					$('#att-'+id).append('<div class="clear"></div>');
				}
			});

		}

		function getAttInfo(id,div){

			var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/item/?item_id="+id;
			url = url+"&callback=?";

			$.getJSON(url, function(data){
				$('#att-info-'+div).html('<br><span class="link bold">'+data.item_list[0].name.en+'</span><div class="clear"></div>'+data.item_list[0].description.en+'<br>');
			});

			var url2 = "http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/raw_loadout_attachment_group_map?item_id="+id+"&c:limit=100&c:join=raw_items%5Eon:item_id%5Eto:id";
			url2 = url2+"&callback=?";

			$.getJSON(url2, function(data2){

				var ability_id = data2.raw_loadout_attachment_group_map_list[0].item_id_join_raw_items.passive_ability_id;
				var url3 = "http://census.daybreakgames.com/s:leigh103/get/'+api_ver+'/raw_zone_effects?ability_id="+ability_id+"&c:join=raw_ref_effect_types^on:type_name^to:code_factory_name^inject_at:key&c:limit=100";
				url3 = url3+"&callback=?";

				$.getJSON(url3, function(data3){

					for (var i=0; i < data3.raw_zone_effects_list.length; i++){

						if (data3.raw_zone_effects_list[i].string1.match(/effectgroup/gi) || data3.raw_zone_effects_list[i].string1.match(/Anim/) || data3.raw_zone_effects_list[i].string1.match(/Id/)){

							// do nothing

						} else {

							var modifiers = '<br>'+data3.raw_zone_effects_list[i].string1.split('.')[1].replace(/([a-z])([A-Z])/g, '$1 $2').replace('Cof','Cone of Fire');
							modifiers += ': ';
							if (data3.raw_zone_effects_list[i].param3){
								var param = parseFloat(data3.raw_zone_effects_list[i].param3);
							} else if (data3.raw_zone_effects_list[i].param4){
								var param = parseFloat(data3.raw_zone_effects_list[i].param4);
							} else if (data3.raw_zone_effects_list[i].param5){
								var param = parseFloat(data3.raw_zone_effects_list[i].param5);
							}

							if (data3.raw_zone_effects_list[i].string1.match(/time/gi)){
								param = param/1000;
								var unit = 's';
							} else if (data3.raw_zone_effects_list[i].string1.match(/multiplier/gi)){
								unit = '%';
							} else if (data3.raw_zone_effects_list[i].string1.match(/projectilespeed/gi)){
								unit = 'm/s';
							} else {
								unit = '';
							}

							if (param != Math.floor(param)){
								if (param < 0 || data3.raw_zone_effects_list[i].string1.match('Override')){
									modifiers += param.toFixed(2)+unit;
								} else {
									modifiers += '+'+param.toFixed(2)+unit;
								}
							} else {
								if (param < 0 || data3.raw_zone_effects_list[i].string1.match('Override')){
									modifiers += param+unit;
								} else {
									modifiers += '+'+param+unit;
								}
							}

							$('#att-info-'+div).append(modifiers);

						}

					}

				});
			});

		}

		function openAddWeaponStats(id){

			$('#add-'+id).toggle();

		}

		function getAddWeaponStats(id){

			// // console.log('Getting Additional');
		//	$('#add-'+id).toggle();
			$('#add-'+id).html('<img src="css/loader.gif" class="loader">');
			var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/fire_mode?item_id="+id+"&c:join=fire_mode_2^on:fire_mode_id^to:fire_mode_id^inject_at:extra&c:limit=10";
			url = url+"&callback=?";

			$.getJSON(url, function(data){

			//	// // console.log(data);
				$('#add-'+id).html('');

				if (data.fire_mode_list[0].armor_penetration > 0){
					ap = 'Yes';
				} else {
					ap = 'No';
				}

				if (data.fire_mode_list[0].extra.fire_ammo_per_shot < '1'){
					data.fire_mode_list[0].extra.fire_ammo_per_shot = 1;
				}

				$('#add-'+id).append('<div class="title link">Characteristics</div><div class="clear"></div><div class="title">Weapon Class</div><div class="data">'+data.fire_mode_list[0].projectile_description+'</div><div class="clear"></div><div class="title">Ammo per Shot</div><div class="data">'+data.fire_mode_list[0].extra.fire_ammo_per_shot+'</div><div class="clear"></div><div class="title">Armor Piercing</div><div class="data">'+ap+'</div><div class="clear"></div>');

				if (data.fire_mode_list[0].pellets_per_shot > 1){
					$('#add-'+id).append('<div class="title">Pellets per Shot</div><div class="data">'+data.fire_mode_list[0].pellets_per_shot+'</div><div class="clear"></div><div class="title">Pellet Spread</div><div class="data">'+data.fire_mode_list[0].pellet_spread+'</div><div class="clear"></div>');
				}

				if (data.fire_mode_list[0].indirect_damage_max > 1){
					$('#add-'+id).append('<div class="title">Damage Radius</div><div class="data">'+data.fire_mode_list[0].damage_radius+'m</div><div class="clear"></div><div class="title">Indirect Damage</div><div class="data"><div class="half">'+data.fire_mode_list[0].indirect_damage_max+'@'+data.fire_mode_list[0].indirect_damage_max_range+'m</div>'+data.fire_mode_list[0].indirect_damage_min+'@'+data.fire_mode_list[0].indirect_damage_min_range+'m</div><div class="clear"></div>');
				}

				if (data.fire_mode_list[0].extra.fire_charge_up_ms > 0){
					$('#add-'+id).append('<div class="title">Charge Time</div><div class="data">'+data.fire_mode_list[0].extra.fire_charge_up_ms+'ms</div><div class="clear"></div>');
				}
				$('#add-'+id).append('<div class="title">Detection Range</div><div class="data">'+data.fire_mode_list[0].extra.fire_detect_range+'m</div><div class="clear"></div>');

				if (data.fire_mode_list[0].extra.description.en.match('Bolt')){

					$('#add-'+id).append('<div class="title">Refire Time</div><div class="data">'+data.fire_mode_list[0].reload_chamber_time_ms+'ms</div><div class="clear"></div>');
				} else if(data.fire_mode_list[0].extra.description.en.match('Single')){

					$('#add-'+id).append('<div class="title">Refire Time</div><div class="data">'+data.fire_mode_list[0].reload_time_ms+'ms</div><div class="clear"></div>');

				} else {
					$('#add-'+id).append('<div class="title">Refire Time</div><div class="data">'+data.fire_mode_list[0].extra.fire_refire_ms+'ms</div><div class="clear"></div>');
				}

				if (data.fire_mode_list[0].extra.damage_head_multiplier < 0 || data.fire_mode_list[0].extra.damage_head_multiplier > 0){
					var hsm = parseFloat(data.fire_mode_list[0].extra.damage_head_multiplier.slice(0,4));
					var hsm_percent = parseFloat(data.fire_mode_list[0].extra.damage_head_multiplier.slice(0,4))*100;

					var hs_max = (data.fire_mode_list[0].damage_max*hsm)+parseInt(data.fire_mode_list[0].damage_max);
					var hs_min = (data.fire_mode_list[0].damage_min*hsm)+parseInt(data.fire_mode_list[0].damage_min);
					$('#add-'+id).append('<div class="title">Headshot Modifier</div><div class="data">+'+hsm_percent+'% ('+hs_max+' - '+hs_min+')</div><div class="clear"></div>');
				}


				if (data.fire_mode_list[0].extra.damage_legs_multiplier < 0 || data.fire_mode_list[0].extra.damage_legs_multiplier > 0){
				//	var lsm = parseFloat(data.fire_mode_list[0].extra.damage_legs_multiplier.slice(0,4))*100;
					var lsm = parseFloat(data.fire_mode_list[0].extra.damage_legs_multiplier.slice(0,4));
					var lsm_percent = parseFloat(data.fire_mode_list[0].extra.damage_legs_multiplier.slice(0,4))*100;

					var lsm_max = (data.fire_mode_list[0].damage_max*lsm)+parseInt(data.fire_mode_list[0].damage_max);
					var lsm_min = (data.fire_mode_list[0].damage_min*lsm)+parseInt(data.fire_mode_list[0].damage_min);
					$('#add-'+id).append('<div class="title">Legshot Modifier</div><div class="data">'+lsm_percent+'% ('+lsm_max+' - '+lsm_min+')</div><div class="clear"></div>');
				}

				if (data.fire_mode_list[0].extra.lockon_aquire_ms > 0){
					$('#add-'+id).append('<div class="title">Lock-on Acquire Time</div><div class="data">'+data.fire_mode_list[0].extra.lockon_acquire_ms+'ms</div><div class="clear"></div><div class="title">Lock-on Angle</div><div class="data">'+data.fire_mode_list[0].extra.lockon_angle+'</div><div class="clear"></div><div class="title">Lock-on Range</div><div class="data">'+data.fire_mode_list[0].extra.lockon_range+'</div><div class="clear"></div>');
				}

				if (data.fire_mode_list[0].extra.recoil_magnitude_min.length > 4){
					mag_min = data.fire_mode_list[0].extra.recoil_magnitude_min.slice(0,4);
				} else {
					mag_min = data.fire_mode_list[0].extra.recoil_magnitude_min;
				}

				if (data.fire_mode_list[0].extra.recoil_magnitude_max.length > 4){
					mag_max = data.fire_mode_list[0].extra.recoil_magnitude_max.slice(0,4);
				} else {
					mag_max = data.fire_mode_list[0].extra.recoil_magnitude_max;
				}

				if (typeof data.fire_mode_list[0].extra.recoil_horizontal_min == 'undefined'){
					data.fire_mode_list[0].extra.recoil_horizontal_min = '0.000';
					data.fire_mode_list[0].extra.recoil_horizontal_max = '0.000';
					data.fire_mode_list[0].extra.recoil_horizontal_tolerance = '0.000';
					data.fire_mode_list[0].extra.recoil_first_shot_modifier = '0.000';
				}

				$('#add-'+id).append('<div class="title link">Recoil</div><div class="clear"></div><div class="title">Recoil Angle (min/max)</div><div class="data"><div class="half">'+data.fire_mode_list[0].extra.recoil_angle_min+'</div>'+data.fire_mode_list[0].extra.recoil_angle_max+'</div><div class="clear"></div><div class="title">Vertical (min/max)</div><div class="data"><div class="half">'+mag_min+'</div>'+mag_max+'</div><div class="clear"></div><div class="title">Horizontal (min/max)</div><div class="data"><div class="half">'+data.fire_mode_list[0].extra.recoil_horizontal_min.slice(0,4)+'</div>'+data.fire_mode_list[0].extra.recoil_horizontal_max.slice(0,4)+'</div><div class="clear"></div><div class="title">Horizonal Tolerance</div><div class="data">'+data.fire_mode_list[0].extra.recoil_horizontal_tolerance.slice(0,4)+'</div><div class="clear"></div><div class="title">First Shot Modifier</div><div class="data">'+data.fire_mode_list[0].extra.recoil_first_shot_modifier.slice(0,4)+'</div><div class="clear"></div><div class="title">Recovery Time</div><div class="data">'+data.fire_mode_list[0].extra.recoil_recovery_rate+'</div><div class="clear"></div><div class="clear"></div>');

				prim = 0; sec = 0; prev_desc = '';

				for (var i=0;i<=data.fire_mode_list.length-1;i++){

					if (data.fire_mode_list[i].type == 'primary' && prim == 0){

						if (prev_desc != data.fire_mode_list[i].extra.description.en){
							$('#mode-'+id).append(' ['+data.fire_mode_list[i].extra.description.en+']');
						}

						if (typeof data.fire_mode_list[i].extra.recoil_angle_min != 'undefined'){

							$('#add-'+id).append('<div class="title link">Hip Fire</div><div class="clear"></div>');
						}

						if (typeof fire_cone[id] == 'undefined'){
							fc = 1;
						} else {
							fc = fire_cone[id];
						}

						if (typeof data.fire_mode_list[i].cof_recoil == 'undefined'){
							data.fire_mode_list[i].cof_recoil = '0.00';
						}

						$('#add-'+id).append('<div class="title indent">Cone of Fire (COF/Bloom per shot)</div><div class="data"><div class="half">'+fc+'</div>'+data.fire_mode_list[i].cof_recoil.slice(0,4)+'</div><div class="clear"></div><div class="title indent">COF Range</div><div class="data">'+data.fire_mode_list[i].extra.cof_range+'</div><div class="clear"></div>');

						$('#add-'+id).append('<div class="title indent">Move Modifier (Move/Turn)</div><div class="data"><div class="half">'+data.fire_mode_list[i].extra.move_modifier+'</div>'+data.fire_mode_list[i].extra.turn_modifier+'</div><div class="clear"></div>');

						prim = 1;
						i_hip = i;

						if (typeof data.fire_mode_list[i].extra.description != 'undefined'){
							prev_desc = data.fire_mode_list[i].extra.description.en;
						}

					} else if (data.fire_mode_list[i].type == 'secondary' && sec == 0 && prim == 1){

						if (typeof data.fire_mode_list[i].extra.description != 'undefined'){
							if (prev_desc != data.fire_mode_list[i].extra.description.en){
								$('#mode-'+id).append(' ['+data.fire_mode_list[i].extra.description.en+']');
							}
						}

						if (typeof data.fire_mode_list[i].extra.recoil_angle_min != 'undefined'){

							$('#add-'+id).append('<div class="clear"></div><div class="title link">Aim Down Sights</div><div class="clear"></div>');
						}

						if (typeof fire_cone[id] == 'undefined'){
							fc = 1;
						} else {
							fc = fire_cone[id];
						}

						if (typeof data.fire_mode_list[i].cof_recoil == 'undefined'){
							data.fire_mode_list[i].cof_recoil = '0.00';
						}

						$('#add-'+id).append('<div class="title indent">Cone of Fire (COF/Bloom per shot)</div><div class="data"><div class="half">'+fc+'</div>'+data.fire_mode_list[i].cof_recoil.slice(0,4)+'</div><div class="clear"></div><div class="title indent">COF Range</div><div class="data">'+data.fire_mode_list[i].extra.cof_range+'</div><div class="clear"></div>');

						$('#add-'+id).append('<div class="title indent">Move Modifier (Move/Turn)</div><div class="data"><div class="half">'+data.fire_mode_list[i].extra.move_modifier+'</div>'+data.fire_mode_list[i].extra.turn_modifier+'</div><div class="clear"></div>');

						sec = 1;
						i_ads = i;

					}


				}
		// draw cof/recoil pattern
				multiplier = 10;
				if (data.fire_mode_list[0].pellets_per_shot > 1){
					fc = data.fire_mode_list[0].pellet_spread*multiplier;
					bullets = data.fire_mode_list[0].pellets_per_shot;
					pellets = 1;
				} else {
					bullets = parseInt($('#clip-'+id).text());
					fc = fire_cone[id]*multiplier;
					pellets = 0;
				}

				id = data.fire_mode_list[0].item_id;


				dg_height = $('#damage-graph-'+id).height();
				dg_width = $('#damage-graph-'+id).width();
				v_recoil = dg_height/2;
				h_recoil = dg_width/2;

			//	$('#damage-graph-'+id).append('<svg height="100%" width="100%" id="fc-pattern-'+id+'-first"><defs><radialGradient id="myRadialGradient4" fx="50%" fy="50%" r="50%" spreadMethod="pad"> <stop offset="0%"   stop-color="#FFE58E" stop-opacity="0.7"/> <stop offset="100%" stop-color="#FFC300" stop-opacity="0.1" /></radialGradient> </defs><circle cx="50%" cy="50%" r="5px" style="fill: url(#myRadialGradient4);"></svg>');
				//$('svg#fc-pattern-'+id+'-first').fadeOut('1000');

				if (!data.fire_mode_list[0].extra.description.en.match('Bolt')){
					rate = data.fire_mode_list[0].extra.fire_refire_ms
				} else {
					rate = data.fire_mode_list[0].reload_chamber_time_ms;
				}

				if (typeof data.fire_mode_list[0].extra.recoil_magnitude_max != 'undefined'){
					mag = data.fire_mode_list[0].extra.recoil_magnitude_max.slice(0,4);
				} else {
					mag = 0.30;
				}

				if (typeof data.fire_mode_list[0].extra.recoil_first_shot_modifier != 'undefined'){
					fsm = data.fire_mode_list[0].extra.recoil_first_shot_modifier.slice(0,4);
				} else {
					fsm = 0.5;
				}

				rangle_max = data.fire_mode_list[0].extra.recoil_angle_max;
				rangle_min = data.fire_mode_list[0].extra.recoil_angle_min;

			//	hip_ads = data.fire_mode_list[i_hip].extra.cof_recoil.slice(0,4)+'/'+data.fire_mode_list[i_ads].extra.cof_recoil.slice(0,4);

				$('#fw-'+id).html('<a href="javascript:void(0)" onclick="testShoot('+id+', '+bullets+', '+pellets+', '+fc+', '+dg_height+', '+dg_width+', '+v_recoil+', '+h_recoil+', '+mag+','+rate+', \''+rangle_min+'/'+rangle_max+'\', '+fsm+', '+data.fire_mode_list[i_hip].extra.cof_recoil.slice(0,4)+', \'hip\');">Hip Fire</a> <a href="javascript:void(0)" onclick="testShoot('+id+', '+bullets+', '+pellets+', '+fc+', '+dg_height+', '+dg_width+', '+v_recoil+', '+h_recoil+', '+mag+','+rate+', \''+rangle_min+'/'+rangle_max+'\', '+fsm+', '+data.fire_mode_list[i_ads].extra.cof_recoil.slice(0,4)+', \'ads\');">ADS Fire</a>');

				modes = $('#mode-'+id).text();
				if (modes.match(/Burst/)){
					bullets = modes.match(/\d+/)[0];
					$('#fw-'+id).append(' <a href="javascript:void(0)" onclick="testShoot('+id+', '+bullets+', '+pellets+', '+fc+', '+dg_height+', '+dg_width+', '+v_recoil+', '+h_recoil+', '+mag+','+rate+', \''+rangle_min+'/'+rangle_max+'\', '+fsm+', '+data.fire_mode_list[i_ads].extra.cof_recoil.slice(0,4)+', \'ads\');">ADS Burst</a>');
				}
			//	$('#damage-graph-'+id).append('<svg height="100%" width="100%"><defs><radialGradient id="myRadialGradient4" fx="50%" fy="50%" r="50%" spreadMethod="pad"> <stop offset="10%"   stop-color="#c40000" stop-opacity="0.4"/> <stop offset="100%" stop-color="#c40000" stop-opacity="0.1" /></radialGradient> </defs><circle cx="50%" cy="50%" r="'+fc+'px" style="fill: url(#myRadialGradient4);"></svg>');

			});

		}

		function testShoot(id, bullets, pellets, fc, dg_height, dg_width, v_recoil, h_recoil, mag, rate, rangle, fsm, cofrecoil, hipads){
			// // console.log(rate);
			$('svg[id^=fc-pattern-'+id+']').remove();
			v_recoil_base = v_recoil;
			fc_shot = 0;
			cofrecoil = cofrecoil*5;
			// // console.log(cofrecoil);
			if (hipads == 'hip'){
				v_bloom = 3;
			} else {
				v_bloom = 1;
			}

			for (iii=1;iii<=bullets;iii++){

					cx_neg = Math.floor(Math.random() * 2) + 1;
					cy_neg = Math.floor(Math.random() * 2) + 1;

					rangle_max = parseInt(rangle.split('/')[1]);
					rangle_min = parseInt(rangle.split('/')[0]);
					hr_angle = rand(rangle_min,rangle_max);
					hr_angle = hr_angle*(Math.PI/180);
					// 1.3tan 10 - yaxistan angle



					if (pellets == 0){

						if (fc_shot >= fc){
							fc_shot = fc;
						} else {
							fc_shot+=cofrecoil;
						}


						v_recoil_diff = (v_recoil_base - v_recoil).toFixed(3);

						if (v_recoil_diff > 0){
							h_recoil_mod = v_recoil_diff*Math.tan(hr_angle);
						//	// // console.log(hr_angle+' '+v_recoil_diff+' '+h_recoil_mod);
						} else {
							h_recoil_mod = 0;
						}

						v_recoil = v_recoil-(parseFloat(mag)*v_bloom);

						if (iii == 2){
							v_recoil = v_recoil-fsm*v_bloom;
						}


						if (cx_neg == 1){
							cx = h_recoil-(Math.floor(Math.random() * fc_shot) + 0)+h_recoil_mod;
						} else {
							cx = h_recoil+(Math.floor(Math.random() * fc_shot) + 0)+h_recoil_mod;
						}

						if (cy_neg == 1){
							cy = v_recoil-(Math.floor(Math.random() * fc_shot) + 0);
						} else {
							cy = v_recoil+(Math.floor(Math.random() * fc_shot) + 0);
						}

						$('#damage-graph-'+id).append('<svg height="100%" width="100%" id="fc-pattern-'+id+'-'+iii+'" class="hidden"><defs><radialGradient id="myRadialGradient5" fx="50%" fy="50%" r="50%" spreadMethod="pad"> <stop offset="20%"   stop-color="#000" stop-opacity="0.7"/> <stop offset="100%" stop-color="#ccc" stop-opacity="0.1" /></radialGradient> </defs><circle cx="'+cx+'px" cy="'+cy+'px" r="4px" style="fill: url(#myRadialGradient5);"></svg>');
						$('svg#fc-pattern-'+id+'-'+iii).show((parseInt(rate)*iii)*2);

					} else {

						if (cx_neg == 1){
							cx = (dg_width/2)-(Math.floor(Math.random() * fc) + 0);
						} else {
							cx = (dg_width/2)+(Math.floor(Math.random() * fc) + 0);
						}

						if (cy_neg == 1){
							cy = (dg_height/2)-(Math.floor(Math.random() * fc) + 0);
						} else {
							cy = (dg_height/2)+(Math.floor(Math.random() * fc) + 0);
						}

						$('#damage-graph-'+id).append('<svg height="100%" width="100%" id="fc-pattern-'+id+'-'+iii+'"><defs><radialGradient id="myRadialGradient5" fx="50%" fy="50%" r="50%" spreadMethod="pad"> <stop offset="20%"   stop-color="#000" stop-opacity="0.7"/> <stop offset="100%" stop-color="#ccc" stop-opacity="0.1" /></radialGradient> </defs><circle cx="'+cx+'px" cy="'+cy+'px" r="4px" style="fill: url(#myRadialGradient5);"></svg>');
					}

				//	setTimeout(function(){
				//		$('svg[id^=fc-pattern-'+id+']').remove();
				//	},15000);

			}

		}

		function getChars(type){

			// console.log('getChars:'+api_ver);
			if (type == 'cookie'){
				id = $('#login').val().toLowerCase();
				id = id.replace(' ','');
			} else {
				if (typeof window.location.href.split('/')[4] != 'undefined'){
					var id = window.location.href.split('/')[4];
				} else {
					var id = window.location.href.split('/')[3];
				}
				id = id.split('?')[0];
				id = id.replace(' ','').toLowerCase();

			}
			setCookie('chars', id, 360);

			id = id.replace('#','');
		//	// // console.log(id);
			id = id.split(',');
			char_ids = '';
			ii = 0;
			$('html').css('background-image', 'url(css/ps2_6.jpg)');
		//	$('body').css('background-image', 'url(game/indar.png)');
			$('.wrapper').html('');
			$('.wrapper').prepend("<div class='over-header text-left bg-black'>PlanetStats.net | <a href='/' class='link'>Characters</a> | <a href='/weapons' class='link' id='weapon_link'>Weapons</a> | <a href='/data/weapons' class='link' id='weapon_link'>Weapon Data</a> | <a href='http://www.redbubble.com/people/l-33/collections/465010-planetside' target='redbubble' class='link'>Support the Site</a>"+api_switch+"<a href='http://www.reddit.com/r/Planetside/comments/28b8j4/welcome_to_your_new_stat_trackercomparerwebapp/' class='link float-right'>[?]</a><form class='float-right' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_top'><input type='hidden' name='cmd' value='_s-xclick'><input type='hidden' name='hosted_button_id' value='NY6SE74FJTL5A'><input type='image' src='https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif' border='0' name='submit' alt='PayPal – The safer, easier way to pay online.'><img alt='' height='0px' border='0' src='https://www.paypalobjects.com/en_GB/i/scr/pixel.gif' width='1' height='1'></form></div>");
			$('.wrapper').append('<div class="content-wrap"></div>');

			if (timeConverter(time).match('Nov 20')){
				var d1=new Date(2012, 11, 20);
				var d2=new Date();

				var milli=d2-d1;
				var milliPerYear=1000*60*60*24*365.26;

				var yearsApart=milli/milliPerYear;

				yearsApart=yearsApart.toFixed(0);

				if (yearsApart == 1){
					yearsApart = '1st';
				} else if (yearsApart == 2){
					yearsApart = '2nd';
				} else if (yearsApart == 3){
					yearsApart = '3rd';
				} else {
					yearsApart = yearsApart+'st';
				}
				$('.over-header').after('<div id="birthday" class="over-header bg-black"><h2>Happy '+yearsApart+' Birthday Planetside 2! ...with love, PlanetStats dev team</h2></div>');
				birthday = 1;
			}

			if (!getCookie('no-ads')){
				$('.over-header').after('<div id="redbubble" class="over-header bg-black text-center"><a href="javascript:void(0)" onclick="setCookie(\'no-ads\',\'1\',30);$(\'#redbubble\').remove();" class="link">[X]</a> <a href="http://www.redbubble.com/people/l-33/collections/465010-planetside" target="redbubble"><img src="/css/banner01.png"></a></div>');
			}

		//	$('.over-header').after('<div id="birthday" class="over-header bg-black text-center"><h3>To the devs that lost their job this week, we wish you all the best for the future - you will all be missed :(</h3> To everyone else, please keep supporting this awesome and unique game!</div>');

			for (var i=0; i < id.length; i++){

				// // console.log(api_ver);
				var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/character/?name.first_lower="+id[i]+"&c:show=character_id,name.first_lower";
				url = url+"&callback=?";
				// console.log(url);
				$.getJSON(url, function(data){

					if (typeof data.character_list != 'undefined') {

						char_ids = char_ids+','+data.character_list[0].character_id;

						if ($(window).width() > 641 && id.length > 9 && $('#table-links').length < 1){
							$('.over-header').append(' | | <span id="table-change"><a href="javascript:void(0)" id="at" class="link text-white" onClick="tableToggle(\'at\');">All Time</a> | <a href="javascript:void(0)" id="month" class="link" onClick="tableToggle(\'month\');">30 Day</a> | <a href="javascript:void(0)" id="week" class="link" onClick="tableToggle(\'week\');">7 Day</a></span>');
							$('.content-wrap').append('<div id="table-links" class="content small"><div class="inline-block" style="width:3%;">Rem</div><div class="inline-block" style="width:20%;">Name</div><div class="inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'rank\');">Rank</a></div><div class="inline-block" style="width:10%;"><a href="javascript:void(0)" onclick="numSort(\'orank\');">Outfit Rank</a></div><div class="inline-block" style="width:5%;"><a href="javascript:void(0)" onclick="numSort(\'class\');">Class</a></div><div class="stat at inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'kdr\');">KDR</a></div><div class="stat week inline-block hidden" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'wkdr\');">KDR</a></div><div class="stat month inline-block hidden" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'mkdr\');">KDR</a></div><div class="stat at inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'spm\');">SPM</a></div><div class="stat month hidden inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'mspm\');">SPM</a></div><div class="stat week hidden inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'wspm\');">SPM</a></div><div class="stat week hidden inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'wacc\');">Accuracy</a></div><div class="stat month hidden inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'macc\');">Accuracy</a></div><div class="stat at inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'acc\');">Accuracy</a></div><div class="stat at inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'acc\');">HSR</a></div><div class="stat month hidden inline-block" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'acc\');">HSR</a></div><div class="stat week inline-block hidden" style="width:7%;"><a href="javascript:void(0)" onclick="numSort(\'acc\');">HSR</a></div><div class="inline-block" style="width:14%;"><a href="javascript:void(0)" onclick="numSort(\'perf\');">Performance</a></div></div>');
						}

						$('.content-wrap').append('<div id="'+data.character_list[0].character_id+'" class="content stat-card"></div>');

						if ($(window).width() > 641 && id.length > 9){

							$('.content').css({
								'max-width':'96%',
								'width':'100%',
								'border':'none',
								'background':'none',
								'padding':'0.1em',
								'margin':'0 auto 0 auto'
							});



							// compact view
							$('#'+data.character_list[0].character_id).load('compact.php?id='+data.character_list[0].character_id+'&&char='+data.character_list[0].name.first_lower);


						} else {

							// standard view
							$('#'+data.character_list[0].character_id).load('statcard.php?id='+data.character_list[0].character_id+'&&char='+data.character_list[0].name.first_lower);

						}

					}

					if (ii == id.length-1 && id.length <= 9){

						var single = $('.stat-card').length;

						if ($(window).width() < 1026 && $(window).width() > 640 && single > 1 || $(window).width() > 1025 && single == 2){

							$('.content').css({
								'float':'left',
								'width': '49%',
								'margin': '0.5%'
							});

						} else if ($(window).width() > 1025 && single > 2){


							$('.content').css({
								'float':'left',
								'width': '32%',
								'margin': '0.5%'
							});


						} else if ($(window).width() < 641){

							$('.content').css({
								'width': '100%'
							});
							$('.fold h1').css({
								'font-size': '2em'
							});
							$('.fold .col2').css({
								'width': '100%'
							});

						}

						resolveIDs('all');

					} else if (ii == id.length-1){

						resolveIDs('all');

					}
					ii++

				});

			}

		}

		function estimateBR(id, br_curr, br_next, br_percent_next, br_time_month, play_time){
			console.log(id, br_curr, br_next, br_percent_next, br_time_month, play_time);
			$.getJSON('https://census.daybreakgames.com/s:leigh103/get/ps2:v2/experience_rank?rank='+br_curr+'&c:show=xp_max', function(data){
				var min_xp = parseInt(data.experience_rank_list[0].xp_max);
				$.getJSON('https://census.daybreakgames.com/s:leigh103/get/ps2:v2/experience_rank?rank='+br_next+'&c:show=xp_max', function(data2){
					var max_xp = parseInt(data2.experience_rank_list[0].xp_max);
					var br_xp = max_xp - min_xp;
					br_xp = (br_xp/100)*br_percent_next;
					br_xp = min_xp+br_xp;
			//		console.log(max_xp, min_xp, br_xp);

					if (br_curr < 100){
						var score_left = 18868950 - br_xp;
					} else {
						var score_left = 37737900 - br_xp;
						$('#estimated-rank-'+id).text('Estimated BR120');
					}
					var br_spm = (br_xp/(play_time/60));
					var hundred = (score_left/br_spm);

					var hundred_min = hundred;
					var hundred_sec = getTimeFromSecs((hundred*60)*60);
				//	hundred_hrs = hundred_hrs.toFixed(0);

					var hundred_mins_per_session = (br_time_month/60)/30;

					var hundred_date = hundred/hundred_mins_per_session;
					hundred_date = time+(hundred_date*24*60*60);

					hundred_date = timeConverter(hundred_date,'short');

					if (br_curr == '120'){

					} else {
						$('#brscore-'+id).text(br_xp.toFixed(0));
						$('#hundred-'+id).text(hundred_sec);
						$('#hundred-hours-'+id).text(hundred_date);
					}
				});
			});
		}


		function resolveIDs(single_id){
			// console.log('Resolving:'+api_ver);
			var single = $('.stat-card').length;
			// // console.log('sing='+single);

			var ids = '';
			var id_cnt = 0;

			if (single_id != 'all'){
				ids = single_id;
				id_cnt = 1;
				// // console.log('SINGLE UPDATE');
			} else {
				$('.stat-card').each(function(){
					ids = ids+','+$(this).attr('id');
					id_cnt++;
				});
				ids = ids.replace(',add','').substring(1);
			}

			stat = {};
			iii = 0;
			max_stat_progress = 0;
			max_stat_ktd = 0;
			max_stat_spm = 0;
			max_stat_perf = 0;
			max_stat_sr = 0;

			var url = "http://census.daybreakgames.com/s:leigh103/get/"+api_ver+"/character/?character_id="+ids+"&c:resolve=outfit_member_extended&c:resolve=stat_history&c:resolve=online_status&c:resolve=world&c:join=world^on:world_id^to:world_id^inject_at:world_id";
			url = url+"&callback=?";

			$.getJSON(url, function(data){

				for (var i=0;i < data.character_list.length; i++){

					var id = data.character_list[i].character_id;

					if (birthday == 1){
						if (data.character_list[i].faction_id == 3){faction = 'Terran Republic'; faction_ab = 'tr'; faction_image = 'css/balloons.png';}
						if (data.character_list[i].faction_id == 1){faction = 'Vanu Sovereignty'; faction_ab = 'vs'; faction_image = 'css/balloons.png';}
						if (data.character_list[i].faction_id == 2){faction = 'New Conglomerate'; faction_ab = 'nc'; faction_image = 'css/balloons.png';}
					} else {
						if (data.character_list[i].faction_id == 3){faction = 'Terran Republic'; faction_ab = 'tr'; faction_image = 'css/tr.png';}
						if (data.character_list[i].faction_id == 1){faction = 'Vanu Sovereignty'; faction_ab = 'vs'; faction_image = 'css/vs.png';}
						if (data.character_list[i].faction_id == 2){faction = 'New Conglomerate'; faction_ab = 'nc'; faction_image = 'css/nc.png';}
					}

					if (single_id == 'all'){
						$('#faction-image-'+id).attr('src', faction_image);
						$('#faction-abbr-'+id).text(faction_ab.toUpperCase());

					}

					if (parseInt(data.character_list[i].battle_rank.value) > 100){
						$('#rank-icon-'+id).attr('src', 'css/battlerank-icons/icon_playerRanks_common_'+data.character_list[i].battle_rank.value+'.png').addClass('br101');
					} else {
						$('#rank-icon-'+id).attr('src', 'css/battlerank-icons/br-'+faction_ab+'-'+data.character_list[i].battle_rank.value+'.png');
					}

					if (!data.character_list[i].outfit_member){
						$('#name-first-'+id).text(data.character_list[i].name.first);

					} else {
						$('#name-first-'+id).html('<a href="/['+data.character_list[i].outfit_member.alias+']" class="outfit-alias">['+data.character_list[i].outfit_member.alias+']</a> '+data.character_list[i].name.first);
						$('#outfit-'+id).text(data.character_list[i].outfit_member.name);
						$('#outfit-rank-'+id).text(data.character_list[i].outfit_member.member_rank);
						$('#outfit-num-'+id).text(data.character_list[i].outfit_member.member_rank_ordinal);
						var member_since = timeConverter(data.character_list[i].outfit_member.member_since, 'year');

						$('#outfit-member-since-'+id).text(member_since);
					}

					$('#br-'+id).text(data.character_list[i].battle_rank.value);

					if (data.character_list[i].battle_rank.value < 99){
						$('#next-rank-'+id).text(+data.character_list[i].battle_rank.value+1);
					} else {
						$('#next-rank-'+id).text(100);
					}

					$('#progress-'+id).css('width', '0%');
					if (data.character_list[i].battle_rank.value == 120){
						$('#progress-'+id).animate({'width': '100%'});
					} else {
						$('#progress-'+id).animate({'width': data.character_list[i].battle_rank.percent_to_next+'%'});
					}

					if (data.character_list[i].battle_rank.percent_to_next > max_stat_progress){
						var max_progress = id;
						max_stat_progress = data.character_list[i].battle_rank.percent_to_next;
					}

					for (var ii=0;ii<data.character_list[i].stats.stat_history.length;ii++){

					//	stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month'] = data.character_list[i].stats.stat_history[ii].month['m01'];
						if (typeof stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month'] == 'undefined'){
							stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month'] = 0;
						}
						for (ivi = 1; ivi < 30; ivi++){
							if (ivi < 10){
								stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month'] = stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month']+parseInt(data.character_list[i].stats.stat_history[ii].day['d0'+ivi]);
							} else {
								stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month'] = stat[data.character_list[i].stats.stat_history[ii].stat_name+'_month']+parseInt(data.character_list[i].stats.stat_history[ii].day['d'+ivi]);
							}
						}
						stat[data.character_list[i].stats.stat_history[ii].stat_name+'_day'] = data.character_list[i].stats.stat_history[ii].day['d01'];
					//	stat[data.character_list[i].stats.stat_history[ii].stat_name+'_week'] = data.character_list[i].stats.stat_history[ii].week['w01'];
						if (typeof stat[data.character_list[i].stats.stat_history[ii].stat_name+'_week'] == 'undefined'){
							stat[data.character_list[i].stats.stat_history[ii].stat_name+'_week'] = 0;
						}
						for (ivi = 1; ivi < 7; ivi++){
							stat[data.character_list[i].stats.stat_history[ii].stat_name+'_week'] = stat[data.character_list[i].stats.stat_history[ii].stat_name+'_week']+parseInt(data.character_list[i].stats.stat_history[ii].day['d0'+ivi]);
						}
						stat[data.character_list[i].stats.stat_history[ii].stat_name+'_at'] = data.character_list[i].stats.stat_history[ii].all_time;
						stat[data.character_list[i].stats.stat_history[ii].stat_name] = data.character_list[i].stats.stat_history[ii].all_time; // included for legacy

					}

					var ktd = stat['kills']/stat['deaths'];
					var spm = stat['score']/(stat['time']/60);
					var kph = stat['kills']/stat['time'];

					br_curr = parseInt(data.character_list[i].battle_rank.value)
					br_next = parseInt(data.character_list[i].battle_rank.value)+1;
					br_percent_next = parseInt(data.character_list[i].battle_rank.percent_to_next);
					br_time_month = parseInt(stat['time_month']);

					var week_prev_timestamp = parseInt(data.character_list[i].times.last_login)-604800;

					var ktd_month = stat['kills_month']/stat['deaths_month'];
					var spm_month = stat['score_month']/(stat['time_month']/60);
					var kph_month = stat['kills_month']/stat['time_month'];

					estimateBR(id, br_curr, br_next, br_percent_next, br_time_month, parseInt(stat['time']));

					var ktd_month_change = ((ktd_month - ktd)/ktd)*100;
					ktd_month_change = ktd_month_change.toFixed(1);
					var spm_month_change = ((spm_month - spm)/spm)*100;
					spm_month_change = spm_month_change.toFixed(0);

					if (ktd_month_change < 1){
						$('#ktd-stat-'+id).css('background-color', 'rgba(191,30,40, 0.4)');
					}
					if (spm_month_change < 1){
						$('#spm-stat-'+id).css('background-color', 'rgba(191,30,40, 0.4)');
					}
					$('#ktd-stat-'+id).css('width', '0%');
					$('#spm-stat-'+id).css('width', '0%');
					$('#ktd-stat-'+id).animate({'width': Math.abs(ktd_month_change)+'%'});
					$('#spm-stat-'+id).animate({'width': Math.abs(spm_month_change)+'%'});

					$('#title-kdr-'+id).attr('title', ktd_month_change+'% Performance Change');
					$('#title-spm-'+id).attr('title', spm_month_change+'% Performance Change');

					if (ktd_month_change > max_stat_ktd){
						var max_ktd = id;
						max_stat_ktd = ktd_month_change;
					}

					if (spm_month_change > max_stat_spm){
						var max_spm = id;
						max_stat_spm = spm_month_change;
					}

					var performance = (parseInt(ktd_month_change) + parseInt(spm_month_change))/2;
					if (performance > 0){
						performance_direction = '% Improvement';
					} else {
						performance = Math.abs(performance);
						performance_direction = '% Decline';
						$('#perf-stat-'+id).css('background-color', 'rgba(191,30,40, 0.4)');
					}



					if (data.character_list[i].online_status > 0 && $('.stat-card').length > 9){
						online = '<font color="#2DDB24">ONLINE</font>';
						$('#name-first-'+id).addClass('green');
						time = Math.round(+new Date()/1000);
						var duration = getTimeFromSecs((time - parseInt(data.character_list[i].times.last_login))*60);
						var duration_int = time - parseInt(data.character_list[i].times.last_login);
						var duration_int = 't='+time+' - l='+data.character_list[i].times.last_login+' = '+duration_int;
					} else if (data.character_list[i].online_status > 0){
						online = '<font color="#2DDB24">ONLINE</font>';
						time = Math.round(+new Date()/1000);
						var duration = getTimeFromSecs((time - parseInt(data.character_list[i].times.last_login))*60);
						var duration_int = time - parseInt(data.character_list[i].times.last_login);
						var duration_int = 't='+time+' - l='+data.character_list[i].times.last_login+' = '+duration_int;
					} else {

						online = 'Offline';
						var hours = parseInt( stat['time_day'] / 3600 ) % 24;
						var minutes = parseInt( stat['time_day'] / 60 ) % 60;
						var seconds = (stat['time_day'] % 60).toFixed(0);

						var duration = (hours < 10 ? "0" + hours : hours) + "h " + (minutes < 10 ? "0" + minutes : minutes) + "m " + (seconds<10 ? "0" + seconds : seconds) + 's';
					}

					$('#st-'+id).html(online);

					var ktd_day = stat['kills_day']/stat['deaths_day'];
					var spm_day = stat['score_day']/(stat['time_day']/60);
					var kph_day = stat['kills_day']/stat['time_day'];

					var ktd_week = stat['kills_week']/stat['deaths_week'];
					var spm_week = stat['score_week']/(stat['time_week']/60);
					var kph_week = stat['kills_week']/stat['time_week'];

					var ktd_week_change = ((ktd_week - ktd)/ktd)*100;
					ktd_week_change = ktd_week_change.toFixed(1);
					var spm_week_change = ((spm_week - spm)/spm)*100;
					spm_week_change = spm_week_change.toFixed(1);

					var performance_week = (parseInt(ktd_week_change) + parseInt(spm_week_change))/2;
					if (performance_week > 0){
						performance_week_direction = '% Improvement';
					} else {
						performance_week = Math.abs(performance_week);
						performance_week_direction = '% Decline';
						$('#perf-stat-'+id).css('background-color', 'rgba(191,30,40, 0.4)');
					}

					$('#ktd-stat-week'+id).css('width', '0%');
					$('#spm-stat-week'+id).css('width', '0%');
					$('#ktd-stat-week'+id).animate({'width': Math.abs(ktd_week_change)+'%'});
					$('#spm-stat-week'+id).animate({'width': Math.abs(spm_week_change)+'%'});

					$('#week-ktd-'+id).text(ktd_week.toFixed(2));
					$('#week-spm-'+id).text(spm_week.toFixed(2));
					$('#kph-week-'+id).text(kph_week.toFixed(2));
					$('#month-ktd-'+id).text(ktd_month.toFixed(2));
					$('#month-spm-'+id).text(spm_month.toFixed(2));
					$('#kph-month-'+id).text(kph_month.toFixed(2));
					$('#at-ktd-'+id).text(ktd.toFixed(2));
					$('#at-spm-'+id).text(spm.toFixed(2));
					$('#kph-'+id).text(kph.toFixed(2));

					var tp_month = getTimeFromSecs(stat['time_month']*60);
					var tp_week = getTimeFromSecs(stat['time_week']*60);
					var tp_at = getTimeFromSecs(stat['time_at']*60);

					$('#tp-month-'+id).text(tp_month);
					$('#tp-week-'+id).text(tp_week);
					$('#tp-'+id).text(tp_at);


					$('#perf-'+id).text(performance.toFixed(1)+performance_direction);
					$('#perf-week-'+id).text(performance_week.toFixed(1)+performance_week_direction);

					$('#perf-stat-'+id).css('width', '0%');
					$('#perf-stat-'+id).animate({'width': performance.toFixed(1)+'%'});

					if (performance.toFixed(1) > max_stat_perf){
						var max_perf = id;
						max_stat_perf = performance.toFixed(1);
					}

					// // console.log(data.character_list[i].battle_rank.value);
				//	var sr = (((ktd_month*100)*(spm_month*100))/(data.character_list[i].battle_rank.value/4))/10000;
					if (spm_month > 400){
						spm_month_mod = 400;
					} else {
						spm_month_mod = spm_month;
					}

					var sr_kdr = (ktd_month/12)*100;
					var sr_spm = (spm_month/1000)*100;
					var sr_tot = sr_kdr+sr_spm;
					sr = sr_tot.toFixed(0);

					if (sr < 1){sr = 1;}

					var sr_next = (sr_tot - sr)*100;

					//var sr_next = (sr_tot-sr)*100;
					sr_next = sr_next.toFixed(0);

					$('#sr-'+id).text(sr_tot.toFixed(0));

					$('#sr-stat-'+id).css('width', '0%');
					$('#sr-stat-'+id).animate({'width': sr_next+'%'});

					if (sr > max_stat_sr){
						var max_sr = id;
						max_stat_sr = sr;
					}

				//	var login_date = timeConverter(data.character_list[i].times.last_login, 'year');

				//	$('#login-session-'+id).text(login_date);
				//	$('#login-session-int-'+id).text(data.character_list[i].times.last_login);

				//	$('#duration-session-'+id).text(duration);
				//	$('#duration-session-int-'+id).text(duration_int);

					var contribs = [];
					contribs = ['5428204126944237121','5428379206558254657','5428379206558254257','5428021759064684177','5428180936964714145','5428153774083896369','5428011263352037809','5428245075231988273','5428051581857743089','5428077644331007697','8262937017477336577','8260571419284117681','5428010618036465073','5428352936459017393','5428355369446219281','5428354325777022513','5428359063323562145','5428011263335537297','5428031585329482049','5428029729514647025','5428238902662552257','5428381682172466225','5428191068389250065','5428191068389249889']
					if(jQuery.inArray(id, contribs)!== -1){
						$('#'+id).addClass(faction_ab);
					} else {
						$('#server-'+id).text(data.character_list[i].world_id.name.en);
					}

			//		if (id == '5428021759064684177'){
			//			$('#'+id).addClass('nc');
			//			$('#server-'+id).parent().html('<span id="custom">NC Supreme Commander</span><span class="sort-rank hidden" id="br-5428021759064684177">100</span>');

			//		} else if (id == '5428180936964714145' || id == '5428153774083896369' || id == '5428011263352037809' || id == '5428245075231988273' || id == '5428051581857743089' || id == '5428077644331007697' || id == '8262937017477336577' || id == '8260571419284117681' || id == '5428010618036465073' || id == '5428352936459017393' || id == '5428355369446219281' || id == '5428354325777022513' || id == '5428359063323562145' || id == '5428011263335537297' || id == '5428031585329482049' || id == '5428029729514647025'){
			//			$('#'+id).addClass(faction_ab);
			//		} else {
			//			$('#server-'+id).text(data.character_list[i].world_id.name.en);
			//		}

					$('#server-'+id).text(data.character_list[i].world_id.name.en);
					$('#server2-'+id).text(data.character_list[i].world_id.name.en);
					$('#server3-'+id).text(data.character_list[i].world_id.world_id);
					var spawned = timeConverter(data.character_list[i].times.creation, 'year');
					$('#spawn-'+id).text(spawned);

					var ktd_day_change = ((ktd_day - ktd)/ktd)*100;
					ktd_day_change = ktd_day_change.toFixed(1);
					var spm_day_change = ((spm_day - spm)/spm)*100;
					spm_day_change = spm_day_change.toFixed(1);

					var session_performance = (parseInt(ktd_month_change) + parseInt(spm_month_change))/2;
					if (session_performance > 0){
						session_performance_direction = '% Improvement';
					} else {
						session_performance = Math.abs(performance);
						session_performance_direction = '% Decline';
					}

					var save_diff = time-data.character_list[i].stats.stat_history[7].last_save;
					var save_diff2 = data.character_list[i].stats.stat_history[7].last_save-data.character_list[i].times.last_login;

					if (save_diff > 1000 && data.character_list[i].online_status != 0){
						$('#spm-session-'+id).parent().prev().html('<a href="javascript:void(0)"  onclick="show(\'shspm-'+id+'\');">SPM * <img src="css/downarrow.png" class="downarrow"></a>');
						$('#spm-session-'+id).parent().prev().attr('title', 'Approx. SPM');
					//	$('#perf-session-'+id).parent().prev().text('Performance *');
					//	$('#perf-session-'+id).parent().prev().attr('title', 'This stat is waiting for an update');
						$('#score-session-'+id).parent().prev().text('Score *');
						$('#score-session-'+id).parent().prev().attr('title', 'Approx. Score');
					}

					if (single_id == 'all'){
						$('#score-session-'+id).text(stat['score_day']);

						var spm_day = stat['score_day']/(stat['time_day']/60);
						$('#spm-session-'+id).text(spm_day.toFixed(2));
					}

					$('#kills-week-'+id).text(stat['kills_week']);
					$('#kills-month-'+id).text(stat['kills_month']);
					$('#kills-'+id).text(stat['kills']);

					$('#deaths-week-'+id).text(stat['deaths_week']);
					$('#deaths-month-'+id).text(stat['deaths_month']);
					$('#deaths-'+id).text(stat['deaths']);

					$('#facility-cap-week-'+id).text(stat['facility_capture_week']);
					$('#facility-cap-month-'+id).text(stat['facility_capture_month']);
					$('#facility-cap-'+id).text(stat['facility_capture']);

					$('#facility-def-week-'+id).text(stat['facility_defend_week']);
					$('#facility-def-month-'+id).text(stat['facility_defend_month']);
					$('#facility-def-'+id).text(stat['facility_defend']);

					$('#medals-week-'+id).text(stat['medals_week']);
					$('#medals-month-'+id).text(stat['medals_month']);
					$('#medals-'+id).text(stat['medals']);

					$('#score-week-'+id).text(stat['score_week']);
					$('#score-month-'+id).text(stat['score_month']);
					$('#score-'+id).text(stat['score']);

					$('#certs-'+id).text(data.character_list[i].certs.available_points);

					$('#certs-earned-week-'+id).text(stat['certs_week']);
					$('#certs-earned-month-'+id).text(stat['certs_month']);
					$('#certs-earned-'+id).text(parseInt(data.character_list[i].certs.earned_points)+parseInt(data.character_list[i].certs.gifted_points));

					$('#certs-spent-'+id).text(data.character_list[i].certs.spent_points);

				//	$('#ktd-stat-'+max_ktd).css('background', 'rgba(52,144,151,0.6)');
				//	$('#spm-stat-'+max_spm).css('background', 'rgba(52,144,151,0.6)');
				//	$('#perf-stat-'+max_perf).css('background', 'rgba(52,144,151,0.6)');
				//	$('#sr-stat-'+max_sr).css('background', 'rgba(52,144,151,0.6)');
				//	$('#progress-'+max_progress).css('background', 'rgba(52,144,151,0.6)');

					if ($('.stat-card').length <= 9){
						//getSessionStats(data.character_list[i].character_id, data.character_list[i].times.last_login);
						getLogin(data.character_list[i].character_id);
					//	getDirectives(id);
					}

					getClass(id);


					if (iii == data.character_list.length-1 && single_id == 'all'){

						numSort('rank');

						$('.wrapper').append("<div class='clear'></div></div><div class='content' id='add'><a href='javascript:void(0)' class='link float-left' onClick='newPlayer();'>+ Add</a><input type='text' placeholder='Add new character new here' id='newplayer'><br></div>");
						$('.wrapper').append('<div class="clear no-border"></div><br><a href="javascript:void(0)" onClick="onSubmit();" id="start_button" class="link">...</a><div id="input" class="hidden"></div><div id="log" class="hidden"></div><form method="POST" enctype="multipart/form-data" action="screenshot.php" id="myForm"><input type="hidden" name="img_val" id="img_val" value="" /><input type="hidden" name="img_name" id="img_name" value="" /></form>');

					}
				//	// // console.log('ii='+ii+' '+data.character_list.length);
					stat = [];
					iii++;

				}



			});

		}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
