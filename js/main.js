
class Slideshow {

    static allSlideshows = {};

    constructor (id, numSlides) {
        this.id = id;
        this.N = numslides;
        this.curSlide = 0;

        allSlideshows[id] = this;
    }

    showSlides (n) {
        let slides = document.querySelectorAll("slide s" + this.id);
        let dots = document.querySelectorAll("slideshow-dot s" + this.id);
        if (n > slides.length) {
            this.curSlide = 0;
        }
        if (n < 0) this.curSlide = slides.length;
        for (let i = 0; i < slides.length; i ++) {
            slides[i].style.display = "none";
        }
        for (let i = 0; i < dots.length; i ++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        slides[this.curSlide].style.display = "block";
        dots[this.curSlide].className += " active";
    }

    plusSlides (n) {
        this.showSlides(this.curSlide += n);
    }

    currentSlide (n) {
        this.showSlides(this.curSlide = n);
    }

    static plusSlides (id, n) {
        this.allSlideshows[id].plusSlides(n);
    }

    static currentSlide (id, n) {
        this.allSlideshows[id].currentSlide(n);
    }

}

var slideshow0 = new Slideshow(0, 3);
