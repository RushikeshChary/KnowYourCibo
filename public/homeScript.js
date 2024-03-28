<!--=============== CURSOR ===============-->
var cursor = document.getElementById("cursor");
document.addEventListener('mousemove', function(e){
  var x = e.clientX;
  var y = e.clientY;
  cursor.style.left = x + "px";
  cursor.style.top = y + "px";
})

<!--=============== ROTATING TEXT ===============-->
const str = "KNOW YOUR CIBO. EAT RATE CURATE.";
const text = document.getElementById("text1");
window.onload = function(){
    for (let i = 0; i < str.length; i++) {
        let span = document.createElement('span');
        span.innerHTML = str[i]
        text.appendChild(span);
        console.log(str[i])
        span.style.transform = `rotate(${11*i}deg)`;
    }
}

let slideIndex = 0;
showSlides();

function showSlides() {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}    
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
  setTimeout(showSlides, 2000); 
}
