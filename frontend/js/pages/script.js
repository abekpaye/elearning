$(document).ready(function() {
  
  $('.join-btn').hover(
    function() {
      $(this).animate({ paddingLeft: '30px', paddingRight: '30px' }, 200);
    },
    function() {
      $(this).animate({ paddingLeft: '20px', paddingRight: '20px' }, 200);
    }
  );
});

document.addEventListener("DOMContentLoaded", function () {
  const joinButton = document.querySelector(".join-btn");
  const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

  if (joinButton) {
    if (loggedUser) {
      joinButton.disabled = true;
      joinButton.innerHTML = "Already Subscribed";
      joinButton.style.cursor = "not-allowed"; 
      joinButton.classList.add("disabled"); 
    } else {

      joinButton.addEventListener("click", function() {
        window.location.href = "page5.html"; 
      });
    }
  }
});
