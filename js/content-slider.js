(function($){

	$.fn.extend({ 

		contentSlider: function(options, callback) {

			var defaults = {
					speed: 500,
					auto: true,
					autoTimeout: 5000,
					slideDirection: "left",
					pauseOnHover: true,
					hasThumbs: true
				},

				options = $.extend(defaults, options);

			return this.each(function() {				

				var elements = {};

				elements.sliderCont = $(this);
				elements.display = elements.sliderCont.find(".display");
				elements.slides = elements.display.children();
				elements.next = elements.sliderCont.find(".next");
				elements.prev = elements.sliderCont.find(".prev");
				elements.thumbs = elements.sliderCont.find(".thumbs").children();
				elements.active = elements.display.children(".active");
				elements.i = elements.active.index();
				elements.displayWidth = elements.display.width();

				var methods = {}; 

				methods.init = function(elements) {

					// Adding class active to a slide will have that slide appear first
					// If no slide has this class, this adds it to the first slide by default.
					if (!elements.active.length) {
						$(elements.slides[0]).addClass("active");
						elements.i = elements.display.children(".active").index();
					}

					// Necessary styles for slider to function properly
					$(elements.display).css({
						position: "relative",
						overflow: "hidden"
					});
					$(elements.slides).css("position", "absolute");

					// Sets all slides to the right of the display box
					// then sets the active slide into the display box
					elements.slides.css("right", -elements.displayWidth);
					$(elements.slides[elements.i]).css("right", 0);

					this.mouseEvents(elements);


					if (options.hasThumbs) {

						// Adds a rel with the index number to each thumb/pagination unit
						// This is needed in case an ellipsis or another element is added to the
						// thumbs list. When an elements is added, it throws the thumbs.length off
						// This insures that the original index position stays intact.
						elements.thumbs.each(function() {
							$(this).attr("rel", $(this).index());
						});

						this.thumbs.updateActiveClass(elements);
					}

					if (options.auto) {
						this.auto.init(options.slideDirection);
					}
				}

				methods.mouseEvents = function(elements) {

					// Instatiates all mouse event listeners.

					elements.next.click(function(){
						clearInterval(methods.auto.autoTimer);
						methods.next(elements);
						methods.auto.init();
					});

					elements.prev.click(function() {
						clearInterval(methods.auto.autoTimer);
						methods.prev(elements)
						methods.auto.init();
					});

					elements.thumbs.click(function() {
						if ($(this).attr("rel")) {
							clearInterval(methods.auto.autoTimer);
							methods.thumbs.clicked($(this), elements);
							methods.auto.init();
						}
					});

					if (options.pauseOnHover) {

						// Mouseenter stops the timer
						// Mouseleave starts it back up

						elements.display.bind({
							mouseenter: function() {
								clearInterval(methods.auto.autoTimer);
							},
							mouseleave: function() {
								methods.auto.init();
							}
						});
					}
					
				}

				// The methods used for sliding the active slide, either to the left (next) or
				// to the right (prev)
				methods.slideMovements = {
					currentSlide: {
						next: function(elements) {
							$(elements.slides[elements.i]).removeClass("active").animate({
								right: elements.displayWidth
							}, options.speed, function(){
								$(this).css("right", -elements.displayWidth);
							});
						},
						prev: function(elements) {
							$(elements.slides[elements.i]).removeClass("active").animate({
								right: -elements.displayWidth
							}, options.speed);
						}
					}
				} 

				methods.next = function(elements) {

					// This methods is in charge or coordinating the movement of the current slide
					// and the next slide.

					// This if block prevents the animation queue from building up
					if ( !$(elements.slides[elements.i]).is(":animated") ) {

						// Directs the current slide to slide next
						methods.slideMovements.currentSlide.next(elements);

						// Tests to see if the current slide is the last slide
						if (elements.i !== elements.slides.length - 1) {

							$(elements.slides[elements.i+1]).addClass("active").animate({
								right: 0
							}, options.speed);

							elements.i = elements.display.children(".active").index();
						}

						// If the current slide is the last, do this
						else {

							$(elements.slides[0]).addClass("active").animate({
								right: 0
							}, options.speed);

							elements.i = 0;
						}

						// Directs the thumbs to update with the new current slide
						if (options.hasThumbs) {
							this.thumbs.updateActiveClass(elements);
						}
					}
				}

				methods.prev = function(elements) {

					// This methods is in charge or coordinating the movement of the current slide
					// and the prev slide.

					// This if block prevents the animation queue from building up
					if ( !$(elements.slides[elements.i]).is(":animated") ) {

						// Directs the current slide to slide prev
						methods.slideMovements.currentSlide.prev(elements);

						// Checks if the current slide is the first slide
						if (elements.i !== 0) {

							$(elements.slides[elements.i-1]).addClass("active").css("right", elements.displayWidth).animate({
								right: 0
							}, options.speed);

							elements.i = elements.display.children(".active").index();
						}

						// If the current slides is the first, do this
						else {

							$(elements.slides[elements.slides.length - 1]).addClass("active").css("right", elements.displayWidth).animate({
								right: 0
							}, options.speed);

							elements.i = elements.display.children(".active").index();
						}

						// Directs the thumbs to update with the new current slide
						if (options.hasThumbs) {
							this.thumbs.updateActiveClass(elements);
						}
					}
				}

				methods.thumbs = {}

				methods.thumbs.updateActiveClass = function(elements) {

					// Moves the class active to the new current slide and removes it from the previously current slide
					$(elements.thumbs.filter( "[rel='{0}']".replace("{0}", elements.i) ) ).addClass("active").siblings().removeClass("active");
					
					// This is useful for pagination. Passes the index position of the current slide. It uses the rel instead of
					// elements.i because the elements.i can be thrown off if ellipsis or another new element is introduced
					// as a sibling element to the thumb elements.
					if (callback) {
						callback( $(elements.thumbs.filter( "[rel='{0}']".replace("{0}", elements.i) ) ).attr("rel") );
					}
				}

				methods.thumbs.clicked = function(_this, elements) {

					// This method is for when an thumbnail/pagination number is clicked as opposed to next/prev

					var i = _this.attr("rel");

					// This if block prevents action if something is already animating (prevents build up of animation queue) or
					// if the thumbail/pagination number is already the active slide.
					if ( !$(elements.slides[elements.i]).is(":animated") && !_this.hasClass("active")) {

						// This if/else checks if the thumbnail clicked is a slide in the next area or the previous area. For example,
						// if the pagination number clicked is 5 and the current slide is 3, it will slide next, but if the current slide
						// was say, 7 it would slide prev
						if (i > elements.i) {
							methods.slideMovements.currentSlide.next(elements);

							$(elements.slides[i]).addClass("active").animate({
								right: 0
							}, options.speed);

							elements.i = elements.display.children(".active").index();

							methods.thumbs.updateActiveClass(elements);
						}

						else {
							methods.slideMovements.currentSlide.prev(elements);

							$(elements.slides[i]).addClass("active").css("right", elements.displayWidth).animate({
								right: 0
							}, options.speed);

							elements.i = elements.display.children(".active").index();

							methods.thumbs.updateActiveClass(elements);
						}
					}
				}

				methods.auto = {}

				methods.auto.init = function() {
					// Instantiates an timer to automatically move the slides
					this.autoTimer = setInterval(this.autoSlide, options.autoTimeout);
				}

				methods.auto.autoSlide = function() {

					if (options.auto) {

						// The slide direction can be customized, either right to left or vice versa. This makes sure
						// the slide direction is correct. Default is from right to left.
						var direction = options.slideDirection;

						if (direction === "left") {
							methods.next(elements);
						}

						else if (direction === "right") {
							methods.prev(elements);
						}
					}
				}				

				methods.init(elements);
			});
		}
	});

})(jQuery);