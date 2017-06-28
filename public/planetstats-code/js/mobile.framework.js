// responsive layout for mobile devices

		$(document).ready(function(){
			
			window_height = $(window).height();
			window_width = $(window).width();
			wrapper_width = $('#wrapper').width();

			window.addEventListener('orientationchange', doOnOrientationChange);

			if (window_width < window_height){
			
				mobileState();
			
			}
			
		});
		
		function mobileState(){
		//	alert('change');
		
			$('head').append('<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">');
			
			window_height = $(window).height();
			window_width = $(window).width();
			wrapper_width = $('#wrapper').width();
		
			$('body').css('font-size','-=3');
		
			$('table').css('font-size','-=4');
		
			$('.header').css({'font-size':'1.3em'});
			$('.header .nav').css({'font-size':'1em'});
			$('.header .menu').css({'font-size':'1em'});
			$('.header p').css({'max-width': '100%'});
			$('.footer p').css({'max-width': '100%'});
		
			$('.content').css({'padding':'2em'});
			$('.content img').css({'width':window_width,'left':'-2em'});
		
			$('[class^="col"]').css({'width':'100%','display':'block'});
		
			$('.fold').css({'width':window_width,'height':window_height,'padding':'0px','font-size':'1.3em'});
		//	$('.fold :header').css({'padding':'1em','margin':'0'});
		
			$('.menu').css({'width':'100%','display':'block'});
		
			$('.menu a').each(function(){
				$(this).wrap('<li>');
			});
		
			$('.menu li').css({'width':'100%','list-style-type':'none'});
		
			$('.nav a').each(function(){
				$(this).wrap('<li>');
			});
		
			$('.nav a').css({'display':'block','max-width':'100%','padding':'0 1em 0 1em'});
			$('.nav li').css({'width':'100%','list-style-type':'none'});
		
			// nav menu collapse
		
			var i = 0;
		
			$('.nav').each(function(){
				i++;
				var nav_links = $(this).html();
				$(this).before('<div class="menu-icon" onClick="toggleDiv(\'nav'+i+'\');"><div></div><div></div><div></div></div>')
				$(this).html('<div id="nav'+i+'" style="display: none;">'+nav_links+'</div>');
			});
		
		}
		
		function desktopState(){
		
			location.reload();
		
		}
		
		function doOnOrientationChange(){
			switch(window.orientation){  
				case -90:
				case 90:
				//	alert('desktop');
					desktopState();
					break; 
				default:				
				//	alert('mobile');
					mobileState();
					break; 
			}
		}
			
