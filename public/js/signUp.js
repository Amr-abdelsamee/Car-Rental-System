document.getElementById("fname").addEventListener("input", function (evt) {
    if (this.value==""){
      this.style.borderBottom = "3px solid red";
    }
    else{
      this.style.borderBottom = "3px solid green";
    }
  });
  document.getElementById("lname").addEventListener("input", function (evt) {
    if (this.value==""){
      this.style.borderBottom = "3px solid red";
    }
    else{
      this.style.borderBottom = "3px solid green";
    }
  });
  document.getElementById("nationalID").addEventListener("input", function (evt) {
    if (this.value=="" || this.value.length != 14 || isNaN(this.value)){
      this.style.borderBottom = "3px solid red";
    }
    else{
      this.style.borderBottom = "3px solid green";
    }
  });
//   document.getElementById("email").addEventListener("input", function (evt) {
//     if (this.value=="" || this.value.indexOf("@") == -1 || this.value.indexOf(".") == -1){
//       this.style.borderBottom = "3px solid red";
//     }
//     else{
//       this.style.borderBottom = "3px solid green";
//     }
//   });
  document.getElementById("password").addEventListener("input", function (evt) {
    if (this.value=="" || this.value.length < 8){
      this.style.borderBottom = "3px solid red";
    }
    else{
      this.style.borderBottom = "3px solid green";
    }
  });
  document.getElementById("address").addEventListener("input", function (evt) {
    if (this.value==""){
      this.style.borderBottom = "3px solid red";
    }
    else{
      this.style.borderBottom = "3px solid green";
    }
  });
  document.getElementById("phone").addEventListener("input", function (evt) {
    if (this.value=="" || this.value.length != 11 || isNaN(this.value)){
      this.style.borderBottom = "3px solid red";
    }
    else{
      this.style.borderBottom = "3px solid green";
    }
  });
  
 document.getElementById("form").addEventListener("submit", function (evt) {
    evt.preventDefault();
    if (document.getElementById("fname").style.borderBottom == "3px solid green" && document.getElementById("lname").style.borderBottom == "3px solid green" && document.getElementById("nationalID").style.borderBottom == "3px solid green"  && document.getElementById("password").style.borderBottom == "3px solid green" && document.getElementById("address").style.borderBottom == "3px solid green" && document.getElementById("phone").style.borderBottom == "3px solid green"){
    document.getElementById("form").submit();
  }
  });
//   {
//     if (document.getElementById("fname").style.borderBottom == "3px solid green" && document.getElementById("lname").style.borderBottom == "3px solid green" && document.getElementById("nationalID").style.borderBottom == "3px solid green" && document.getElementById("email").style.borderBottom == "3px solid green" && document.getElementById("password").style.borderBottom == "3px solid green" && document.getElementById("address").style.borderBottom == "3px solid green" && document.getElementById("phone").style.borderBottom == "3px solid green"){
//     document.getElementById("form").submit();
//   }