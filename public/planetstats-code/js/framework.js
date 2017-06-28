		$(document).ready(function(){

			window_height = $(window).height();
			window_width = $(window).width();
			wrapper_width = $('#wrapper').width();

			login_ok = 0;

		//	$('.draggable').draggable();



			$('body').click(function(){
				$('.pulldown').hide();
			});

		// checkboxes and radio button styling

			var input_tags = document.getElementsByTagName('input');
			checkbox_count = 0;
			radio_count = 0;
			text_count = 0;

			for (var i=0, length = input_tags.length; i<length; i++) {
				if (input_tags[i].type == 'checkbox') {
					checkbox_count++;
				}
				if (input_tags[i].type == 'radio') {
					radio_count++;
				}
				if (input_tags[i].type == 'text') {
					text_count++;
				}
			}

			var i = 1;

			$('input[type=checkbox]').each(function(){
				label = $(this).attr('label');
				if (label != ""){

					$(this).attr('id', label.replace(/ /g,'-'));

					$(this).addClass('styled');
					$(this).after('<label for="'+label.replace(/ /g,'-')+'">'+label+'</label>');

				}
				if (i >= checkbox_count){
					return false;
				}
				i++;
			});

			var i = 1;

			$('input[type=radio]').each(function(){
				label = $(this).attr('label');
				if (label){

					id = $(this).attr('id');

					if (id != ""){
						id = 'radio-'+label.replace(/ /g, '-');
					}

					$(this).attr('id', id);
					$(this).addClass('styled');
					$(this).after('<label for="'+id+'">'+label+'</label>');

				}
				if (i >= radio_count){
					return false;
				}
				i++;

			});

			var i = 1;

			$('input[type=text]').each(function(){
				validation = $(this).attr('validation');
				if (validation == 'email'){

					$(this).css('width', '80%');
					var width = $(this).width();

					if (width > 250){
						$(this).before('<div class="validation email">email</div>');
					} else {
						$(this).before('<div class="validation email">@</div>');
					}

				} else if (validation == 'tel'){

					$(this).css('width', '80%');
					var width = $(this).width();

					if (width > 300){
						$(this).before('<div class="validation email">telephone</div>');
					} else {
						$(this).before('<div class="validation email">tel</div>');
					}

				} else if (validation == 'mob'){

					$(this).css('width', '80%');
					var width = $(this).width();

					if (width > 300){
						$(this).before('<div class="validation email">mobile</div>');
					} else {
						$(this).before('<div class="validation email">mob</div>');
					}

				} else if (validation == 'car reg' || validation == 'car-reg' || validation == 'car-registration' || validation == 'car_reg'){

					$(this).css({'width': '80%', 'text-transform': 'uppercase'});
					var width = $(this).width();

					if (width > 300){
						$(this).before('<div class="validation email">car registration</div>');
					} else {
						$(this).before('<div class="validation email">car</div>');
					}

				} else if (validation != null) {

					$(this).css('width', '80%');
					var width = $(this).width();

					if (width > 300){
						$(this).before('<div class="validation email">'+validation+'</div>');
					} else {
						$(this).before('<div class="validation email">'+validation+'</div>');
					}

				}

				if (i >= text_count){
					return false;
				}
				i++;
			});

			$('input[type=text]').keyup(function(){

				validation = $(this).attr('validation');
				value = $(this).val();

				if (validation == 'email' && value.match(/([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})/)){

					$(this).prev().css('background', '#C9F3CB');
					login_ok = 1;

				} else if (validation == 'tel' && value.match(/([0-9]{8}|[0-9]{3}-|[0-9]{3}(.*?)[0-9]{3}(.*?)[0-9]{4}|[0-9]{3}(.*?)[0-9]{4}(.*?)[0-9]{3})/) || validation == 'mob' && value.match(/([0-9]{8}|[0-9]{3}-|[0-9]{3}(.*?)[0-9]{3}(.*?)[0-9]{4}|[0-9]{4}(.*?)[0-9]{3}(.*?)[0-9]{3})/)){

					$(this).prev().css('background', '#C9F3CB');

				} else if (validation == 'car-registration' && value.match(/^(([a-hj-pr-yA-HJ-PR-Y]{2}([0][1-9]|[1-9][0-9])|[a-hj-pr-yA-HJ-PR-Y]{1}([1-9]|[1-2][0-9]|30|31|33|40|44|55|50|60|66|70|77|80|88|90|99|111|121|123|222|321|333|444|555|666|777|888|999|100|200|300|400|500|600|700|800|900))[ ][a-hj-pr-yA-HJ-PR-Z]{3})$/)){

					$(this).prev().css('background', '#C9F3CB');

				} else if (validation == 'name' && value.match(/^((.*?)\s(.*?))$/)){

					$(this).prev().css('background', '#C9F3CB');

				} else {

					$(this).prev().css('background', '');

				}

			});



		// caluclates the fold size and full width images

			$('.fold').each(function(){
				console.log('fold');
				$(this).css({'height': window_height,
				'width': window_width});
			});

		// cycle through each div

			$('div').each(function(){

				var bg = $(this).attr('background');

				if (typeof bg != 'undefined'){

					if (bg.split(',').length == 4){

						$(this).css({'background-color':'rgba('+bg+')'});

					} else if (bg.match(/\,/)){

						bg_src = bg.split(',')[0];
						opacity = parseFloat(bg.split(',')[1].replace('%',''));

						if (opacity > 1){
							opacity = opacity/100;
						}

						if (bg_src.match(/\.[a-zA-Z]/)){

							$(this).css({'background-color':'rgba(0,0,0,'+opacity+')'});
							$(this).append('<div style="content:\'\'; background: url('+bg_src+'); background-size: cover; top: 0; bottom: 0; left: 0; right: 0; position: absolute; z-index: -1;"></div>');

						} else if (bg_src.match(/\#/)){

							bg_src = hexToRgb(bg_src);
							console.log(bg_src);
							$(this).css({'background-color':'rgba('+bg_src+','+opacity+')'});

						}

					} else {

						if (bg.match(/\.[a-zA-Z]/)){

							$(this).css({'background':'url('+bg+')','background-size':'cover'});

						} else if (bg.match(/\,/)){

							$(this).css({'background-color':'rgb('+bg+')'});

						} else if (bg.match(/\#/)){

							bg = hexToRgb(bg);
							$(this).css({'background-color':'rgb('+bg+')'});

						}

					}

				}


			});

		// img transformations

			$('img').each(function(){
				var opacity = $(this).attr('opacity');
				if (typeof opacity != 'undefined'){

					opacity = opacity.replace('%','');

					if (parseInt(opacity) > 1){
						opacity = opacity/100;
					}

					$(this).css('opacity',opacity);

				}
			});


		});

		$(window).load(function () {
				initDropdowns();
		});

		function initDropdowns(){
			setTimeout(function(){

				$('ul.dropdown').each(function(){
					$(this).show();
					var dropdown_name = $(this).attr('label');
					var dropdown_contents = $(this).html();

					if (!dropdown_contents.match(/pulldown/gi)){
						$(this).attr('value', '');
						$(this).html("");
						$(this).html('<span class="dd-name">'+dropdown_name+'</span><div class="arrow down"></div><div class="pulldown" style="width: '+dropdown_width+'px">'+dropdown_contents+'</div>');
						var dropdown_width = $(this).outerWidth();
						$(this).children('.pulldown').css('width',dropdown_width);
					}
				});


				$('ul.dropdown').click(function(e){
					$('.pulldown').hide();
					e.stopPropagation();
					$(this).find('.pulldown').toggle();
					dropdown_click = 0;
				});

				$('ul.dropdown li').click(function(e){
					$(this).parent().hide();
					e.stopPropagation();
					var select = $(this).text();

					if ($(this).attr('value') != null){
						var value = $(this).attr('value');
					} else {
						var value = select;
					}
				//	console.log(select+' '+value);
					$(this).parent().parent().attr('value', value);
					dropdown_click = 1;

					if ( typeof dropdownClick == 'function' ) {
						console.log($(this).parent().parent().attr('id'));
						dropdownClick($(this).parent().parent().attr('id'));
					}

					$(this).parent().parent().find('.dd-name').text(select);

				});
			},200);
		}

		function toggleDiv(id){
			$('#'+id).slideToggle();
		}

		function cutHex(h) {
			return (h.charAt(0)=="#") ? h.substring(1,7):h
		}

		function hexToRgb(h) {
			var r = parseInt((cutHex(h)).substring(0,2),16);
			var g = parseInt((cutHex(h)).substring(2,4),16);
			var b = parseInt((cutHex(h)).substring(4,6),16);

			return r + "," + g + "," + b;
		}

		function ucwords(str){
		    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}

		function rand(min, max) {
		    return Math.random() * (max - min) + min;
		}

		function isNumeric(input){
		    return (input - 0) == input && (''+input).trim().length > 0;
		}

		function setCookie(cname, cvalue, exdays) {
			var d = new Date();
			d.setTime(d.getTime() + (exdays*60*60*1000));
			var expires = "expires="+d.toUTCString();
			document.cookie = cname + "=" + cvalue + "; " + expires;
		}

		function getCookie(cname) {
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
			}
			return "";
		}

		function getTimeFromSecs(secs){

			var sec_num = secs/60; // don't forget the second param
			var hours   = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);
			seconds = seconds.toFixed(0);
			if (hours   < 10) {hours   = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}


		//	var time    = hours+'h '+minutes+'m '+seconds+'s';
			var time    = hours+'h '+minutes+'m '+seconds+'s';
			return time;
		}

		function timeConverter(UNIX_timestamp, opt){
			
			var tz = getCookie('tz');

			var a = new Date(UNIX_timestamp*1000);
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			var months_long = ['January','February','March','April','May','June','July','August','September','October','November','December'];
			var year = a.getFullYear();
			var month = months[a.getMonth()];
			var month_long = months_long[a.getMonth()];
			var mon = a.getMonth()+1;
			if (mon < 10){
				mon = '0'+mon;
			}
			var date = a.getDate();
			if (date < 10){
				date = '0'+date;
			}
			var hour = a.getHours();

			if (tz == 'Europe/London'){}
			if (tz == 'America/Denver'){
				//if (hour < 6){hour = parseInt(hour)+23;}
				hour = parseInt(hour)-6;
				if (hour < 0){
					hour = parseInt(hour)+24;
				}
			}
			if (tz == 'Asia/Singapore'){
				hour = parseInt(hour)+9;
				if (hour > 23){
					hour = parseInt(hour)-24;
					date = a.getDate()+1;
				}
			}

			var min = a.getMinutes();

			min_check = min.toString().length;
			if (min_check == 1){min = '0'+min;}

			var sec = a.getSeconds();

			if (opt == 'short'){
				var time = date + ' ' + month + ' ' + year;
			} else if (opt == 'long'){
				var time = date + nth(date)+' ' + month_long + ' ' + year;
			} else if (opt == 'year'){
				var time = month + ' ' + date + ' ' + year + ' ' + hour + ':' + min ;
			} else {
				var time = month + ' ' + date + ' ' + hour + ':' + min ;
			}
			return time;
		}
