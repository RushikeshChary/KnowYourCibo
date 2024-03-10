// <!--=============== CURSOR ===============-->
var cursor = document.getElementById("cursor");
document.addEventListener('mousemove', function(e){
  var x = e.clientX;
  var y = e.clientY;
  cursor.style.left = x + "px";
  cursor.style.top = y + "px";
})

// <!--=============== ROTATING TEXT ===============-->
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


