class StarRating {
  constructor(container, rating = 0) {
    this.container = container;
    this.votedRating = 0;
    this.setGraphics();
    this.setRating(rating);
  }

  setRating(rating) {
    this.rating = rating;
    this.updateRating(this.rating);
  }

  updateRating(rate) {
    this.container.querySelector(".full-star-container").style.clipPath = "inset(0 " + Math.round((1-rate)*100).toString() + "% 0 0)";
  }

  setGraphics() {
    this.container.classList.add("star-rating");
    this.container.innerHTML = '<div class="empty-star-container"> <i class="far fa-star"></i> <i class="far fa-star"></i> <i class="far fa-star"></i> <i class="far fa-star"></i> <i class="far fa-star"></i> </div> <div class="full-star-container"> <i class="fas fa-star"></i> <i class="fas fa-star"></i> <i class="fas fa-star"></i> <i class="fas fa-star"></i> <i class="fas fa-star"></i></div>';
  }

  activateRating(ratingFunction) {
    var self = this;
    this.ratingFunction = ratingFunction;

    this.container.style.cursor = "pointer";

    this.container.addEventListener("mouseover", function(e) {
      var rect = e.currentTarget.getBoundingClientRect();
      var x = e.clientX - rect.left; //x position within the element.
      var y = e.clientY - rect.top;  //y position within the element.
      var xPerc = x/rect.width;
      if(xPerc < 0.10) {
        var rPerc = 0;
      } else {
        var rPerc = Math.trunc(5*xPerc + 1)/5;//rounded percentage to correspond to a full star
      }
      self.updateRating(rPerc);
      self.votedRating = rPerc;
    });
    this.container.addEventListener("mouseleave", function(e) {
      self.updateRating(self.rating);
    });
    this.container.addEventListener("click", function(e) {
      self.ratingFunction(self.votedRating);
    });
  }
}
