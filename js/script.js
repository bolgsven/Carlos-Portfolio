$(window).on("load", function() {

	$(".loader .inner").fadeOut(500, function() {
		$(".loader").fadeOut(750);
	});

	if ($(".items").length) {
		$(".items").isotope({
			filter: '*',
			animationOptions: {
				duration: 1500,
				easing: 'linear',
				queue: false
			}
		});
	}
});

$(document).ready(function() {

	if ($("#slides").length) {
		$('#slides').superslides({
			animation: 'fade',
			play: 3000,
			pagination: false
		});
	}

	if ($(".typed").length) {
		new Typed(".typed", {
			strings: [
				"Web Developer.",
				"IT & Networking Student.",
				"Luxury Retail Professional."
			],
			typeSpeed: 50,
			loop: true,
			startDelay: 1000,
			showCursor: false
		});
	}

	if ($('.owl-carousel').length) {
		$('.owl-carousel').owlCarousel({
			loop: true,
			items: 4,
			responsive: {
				0: { items: 1 },
				480: { items: 2 },
				768: { items: 3 },
				938: { items: 4 }
			}
		});
	}

	var skillsTopOffset = $(".skillsSection").length ? $(".skillsSection").offset().top : null;
	var statsTopOffset = $(".statsSection").length ? $(".statsSection").offset().top : null;
	var countUpFinished = false;
	var chartsStarted = false;

	$(window).scroll(function() {

		if (!chartsStarted && skillsTopOffset !== null && window.pageYOffset > skillsTopOffset - $(window).height() + 200) {
			$('.chart').easyPieChart({
				easing: 'easeInOut',
				barColor: '#fff',
				trackColor: false,
				scaleColor: false,
				lineWidth: 4,
				size: 152,
				onStep: function(from, to, percent) {
					$(this.el).find('.percent').text(Math.round(percent));
				}
			});
			chartsStarted = true;
		}

		if (!countUpFinished && statsTopOffset !== null && window.pageYOffset > statsTopOffset - $(window).height() + 200) {
			$(".counter").each(function() {
				var element = $(this);
				var endVal = parseInt(element.text(), 10);
				element.countup(endVal);
			});
			countUpFinished = true;
		}
	});

	$("[data-fancybox]").fancybox();

	$("#filters a").click(function(e) {
		e.preventDefault();
		$("#filters .current").removeClass("current");
		$(this).addClass("current");

		var selector = $(this).attr("data-filter");
		$(".items").isotope({
			filter: selector,
			animationOptions: {
				duration: 1500,
				easing: 'linear',
				queue: false
			}
		});
	});

	/* Smooth scrolling for internal navigation links */
	$("#navigation a[href^='#']").click(function(e) {
		var targetElement = $(this).attr("href");

		if (targetElement === "#" || !$(targetElement).length) {
			return;
		}

		e.preventDefault();
		var targetPosition = $(targetElement).offset().top;
		$("html, body").animate({ scrollTop: targetPosition - 70 }, 600);

		/* Close the Bootstrap menu after selecting a link on mobile */
		if ($(".navbar-collapse").hasClass("show")) {
			$(".navbar-collapse").collapse("hide");
		}
	});

	const nav = $("#navigation");

	if (nav.length) {
		const navTop = nav.offset().top;
		$(window).on("scroll", stickyNavigation);

		function stickyNavigation() {
			var body = $("body");

			if ($(window).scrollTop() >= navTop) {
				body.css("padding-top", nav.outerHeight() + "px");
				body.addClass("fixedNav");
			}
			else {
				body.css("padding-top", 0);
				body.removeClass("fixedNav");
			}
		}
	}
});
