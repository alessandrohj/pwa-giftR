const APP = {
  //baseURL: "http://giftr-api-elb2-1386159590.us-east-1.elb.amazonaws.com/",
  baseURL: "https://giftr.mad9124.rocks/",
  OWNERKEY: "giftr-<Gyuyoung-Lee/Alessandro-deJesus>-owner",
  token: sessionStorage.getItem("token"),
  owner: null,
  ownerName: null,
  GIFTS: [],
  PEOPLE: [],
  PID: null,
  PNAME: null,
  test: null,
  init() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          APP.SW = registration.installing || registration.waiting || registration.active;
        },
        (error) => {
          console.log("Service worker registration failed:", error);
        }
      );
      navigator.serviceWorker.addEventListener("controllerchange", async () => {
        APP.SW = navigator.serviceWorker.controller;
      });
      navigator.serviceWorker.addEventListener("message", APP.onMessage);
    } else {
      console.log("Service workers are not supported.");
    }
    APP.pageLoaded();
    APP.addListeners();
  },
  pageLoaded() {
    let params = new URL(document.location).searchParams;
    APP.page = document.body.id;
    switch (APP.page) {
      case "home":
        if (params.has("out")) {
          APP.owner = null;
          APP.GIFTS = [];
          APP.PEOPLE = [];
          APP.PID = null;
          APP.PNAME = null;
        }
        break;
      case "people":
        APP.getOwner().getPeople();
        break;
      case "gifts":
        APP.PID = params.get("pid");
        APP.getOwner().getGifts();
        break;
    }
  },
  getOwner() {
    let id = sessionStorage.getItem(APP.OWNERKEY);
    let ownerName = sessionStorage.getItem("ownerName");
    if (id) {
      APP.owner = id;
      APP.ownerName = ownerName;
      return APP;
    } else {
      location.href = "/index.html?out";
    }
  },
  addListeners() {
    if (APP.page === "home") {
      let btnReg = document.getElementById("btnRegister");
      btnReg.addEventListener("click", (ev) => {
        location.href = "/pages/register.html";
        let email = document.getElementById("email").value;
        email = email.trim();
      });
      let btnLogin = document.getElementById("btnLogin");
      btnLogin.addEventListener("click", (ev) => {
        let email = document.getElementById("email").value;
        email = email.trim();
        let password = document.getElementById("password").value;
        if (email && password) {
          APP.getToken(email, password);
        } else {
          window.alert("Please enter email address and password");
        }
      });
    }
    if (APP.page === "updatePwd") {
      let btnUpdatePwd = document.querySelector(".updateNewPwd");
      btnUpdatePwd.addEventListener("click", (ev) => {
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value;
        let passwordLength = password.trim().length;
        if (email && passwordLength >= 1) {
          let payload = { emailAddress: email, pass: password };
          if (payload) {
            APP.updatePwd(payload);
          }
        } else {
          window.alert("Invalid email or password. Please check it again");
          document.querySelector(".updateForm").reset();
        }
      });
    }
    if (APP.page === "register") {
      let btnRegister = document.getElementById("btnRegister");
      btnRegister.addEventListener("click", (ev) => {
        let firstName = document.getElementById("firstName").value.trim();
        let lastName = document.getElementById("lastName").value.trim();
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value.trim();
        if (firstName && lastName && email && password) {
          let payload = { first: firstName, last: lastName, emailAddress: email, pass: password };
          APP.registerUser(payload);
        } else {
          window.alert("Invalid input. Please check again");
        }
      });
    }
    if (APP.page === "people") {
      let elemsP = document.querySelectorAll(".modal");
      let instancesP = M.Modal.init(elemsP, { dismissable: true });
      let elemsL = document.querySelectorAll(".sidenav");
      let instancesL = M.Sidenav.init(elemsL, {
        edge: "left",
        draggable: true,
      });
      let btnSave = document.getElementById("btnSavePerson");
      btnSave.addEventListener("click", APP.addPerson);
      let section = document.querySelector(`section.people`);
      section.addEventListener("click", APP.delOrViewPerson);
      document.querySelector("#modalAddPerson form").addEventListener("submit", (ev) => {
        ev.preventDefault();
      });
      let btnLogOut = document.querySelector("#btnLogOut");
      btnLogOut.addEventListener("click", (ev) => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("ownerName");
        sessionStorage.removeItem(APP.OWNERKEY);
      });
      let btnUpdatePwd = document.querySelector("#btnUpdatePwd");
      btnUpdatePwd.addEventListener("click", (ev) => {
        location.href = "updatePwd.html";
      });
    }
    if (APP.page === "gifts") {
      let elemsG = document.querySelectorAll(".modal");
      let instancesG = M.Modal.init(elemsG, { dismissable: true });
      let elemsL = document.querySelectorAll(".sidenav");
      let instancesL = M.Sidenav.init(elemsL, {
        edge: "left",
        draggable: true,
      });
      let btnSave = document.getElementById("btnSaveGift");
      btnSave.addEventListener("click", APP.addGift);
      let section = document.querySelector(`section.gifts`);
      section.addEventListener("click", APP.delGift);
      document.querySelector("#modalAddGift form").addEventListener("submit", (ev) => {
        ev.preventDefault();
      });
      let btnLogOut = document.querySelector("#btnLogOut");
      btnLogOut.addEventListener("click", (ev) => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("ownerName");
        sessionStorage.removeItem(APP.OWNERKEY);
      });
    }
  },
  getToken: (email, password) => {
    let url = APP.baseURL + "auth/tokens";
    let options = {
      method: "POST",
      body: JSON.stringify({ email: email, password: password }),
      headers: {
        "Content-type": "application/json",
        "x-api-key": "deje0014",
      },
    };
    fetch(url, options)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        APP.ownerName = data.data.firstName + " " + data.data.lastName;
        sessionStorage.setItem("token", data["data"].token);
        sessionStorage.setItem("ownerName", APP.ownerName);
        APP.validateToken(data["data"].token);
      })
      .catch((err) => window.alert("Please check your email or password again"));
  },
  validateToken: (token) => {
    let url = APP.baseURL + "auth/users/me";
    let options = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + token,
        "x-api-key": "deje0014",
      },
    };
    fetch(url, options)
      .then(
        (resp) => {
          if (resp.ok) {
            return resp.json();
          }
          throw new Error(resp.statusText);
        },
        (err) => {
          console.warn({ err });
        }
      )
      .then((data) => {
        APP.owner = data["data"]._id;
        sessionStorage.setItem(APP.OWNERKEY, APP.owner);
        console.log("Logged in... go to people page");
        APP.ownerName = data.data.firstName + " " + data.data.lastName;
        sessionStorage.setItem("ownerName", APP.ownerName);
        location.href = `/pages/people.html?owner=${APP.owner}`;
      })
      .catch((err) => {
        APP.handleError(err);
      });
  },
  registerUser: (payload) => {
    console.log(payload);
    let url = APP.baseURL + "auth/users";
    let options = {
      method: "POST",
      body: JSON.stringify({ firstName: payload.first, lastName: payload.last, email: payload.emailAddress, password: payload.pass }),
      headers: {
        "Content-type": "application/json",
        "x-api-key": "deje0014",
      },
    };
    fetch(url, options)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then(() => {
        APP.getToken(payload.emailAddress, payload.pass);
      })
      .catch((err) => console.warn(err));
  },
  updatePwd: (payload) => {
    console.log(payload);
    let url = APP.baseURL + "auth/users/me";
    let options = {
      method: "PATCH",
      body: JSON.stringify({ email: payload.emailAddress, password: payload.pass }),
      headers: {
        "Content-type": "application/json",
        "x-api-key": "deje0014",
        Authorization: "Bearer " + APP.token,
      },
    };
    fetch(url, options)
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        let savedMsg = document.querySelector(".updateMsg");
        savedMsg.classList.toggle("hide");
        let updateForm = document.querySelector(".updateForm");
        updateForm.classList.toggle("hide");
      })
      .catch((err) => console.warn(err));
  },
  delGift(ev) {
    ev.preventDefault();
    console.log(ev.target);
    let btn = ev.target;
    if (btn.classList.contains("del-gift")) {
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      let url = APP.baseURL + "api/people/" + APP.PID + "/gifts/" + id;
      let options = {
        method: "DELETE",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + APP.token,
          "x-api-key": "deje0014",
        },
      };
      fetch(url, options)
        .then((resp) => {
          if (resp.ok) return resp.json();
          throw new Error(resp.statusText);
        })
        .then((data) => {
          APP.GIFTS = APP.GIFTS.filter((gift) => {
            return gift._id != id;
          });
          APP.buildGiftList();
        })
        .catch((err) => console.warn(err));
    }
  },
  delOrViewPerson(ev) {
    ev.preventDefault();
    console.log(ev.target);
    let btn = ev.target;
    if (btn.classList.contains("del-person")) {
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      let url = APP.baseURL + "api/people/" + id;
      let options = {
        method: "DELETE",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + APP.token,
          "x-api-key": "deje0014",
        },
      };
      fetch(url, options)
        .then((resp) => {
          if (resp.ok) return resp.json();
          throw new Error(resp.statusText);
        })
        .then((data) => {
          APP.PEOPLE = APP.PEOPLE.filter((person) => {
            return person._id != data.data._id;
          });
          APP.buildPeopleList();
        })
        .catch((err) => console.warn(err));
    }
    if (btn.classList.contains("view-gifts")) {
      console.log("go view gifts");
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      let url = `/pages/gifts.html?owner=${APP.owner}&pid=${id}`;
      location.href = url;
    }
  },
  addPerson(ev) {
    ev.preventDefault();
    let name = document.getElementById("name").value;
    let nameLength = name.trim().length;
    let dob = document.getElementById("dob").value;
    let birthDate = new Date(dob).valueOf();
    if (nameLength == 0 || dob.length == 0) {
      window.alert("Invalid name and date format. Please check again.");
      document.querySelector(".modal form").reset();
    } else {
      console.log(name, dob);
      let person = {
        name,
        birthDate,
        gifts: [],
        owner: APP.owner,
      };
      let url = APP.baseURL + "api/people";
      let options = {
        method: "POST",
        body: JSON.stringify(person),
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + APP.token,
          "x-api-key": "deje0014",
        },
      };
      fetch(url, options)
        .then(
          (resp) => {
            if (resp.ok) {
              return resp.json();
            }
            throw new Error(resp.statusText);
          },
          (err) => {
            console.warn({ err });
          }
        )
        .then((data) => {
          APP.PEOPLE.push(data.data);
          APP.buildPeopleList();
          document.querySelector(".modal form").reset();
        })
        .catch((err) => {
          APP.handleError(err);
        });
    }
  },
  addGift(ev) {
    ev.preventDefault();
    let name = document.getElementById("name").value;
    let nameLength = name.trim().length;
    let price = document.getElementById("price").value;
    let storeName = document.getElementById("storeName").value;
    let storeNameLength = storeName.trim().length;
    let storeProductURL = document.getElementById("storeProductURL").value.trim();
    let urlPattern = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm;
    let result = urlPattern.test(storeProductURL);
    if (nameLength == 0 || isNaN(price) || price < 100 || storeNameLength == 0 || !result) {
      window.alert("Invalid input. Please check again.");
      document.querySelector(".modal form").reset();
    } else {
      let gift = {
        name,
        price,
        store: {
          name: storeName,
          productURL: storeProductURL,
        },
      };
      let url = APP.baseURL + "api/people/" + APP.PID + "/gifts";
      let options = {
        method: "POST",
        body: JSON.stringify(gift),
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + APP.token,
          "x-api-key": "deje0014",
        },
      };
      fetch(url, options)
        .then(
          (resp) => {
            if (resp.ok) {
              return resp.json();
            }
            throw new Error(resp.statusText);
          },
          (err) => {
            APP.handleError(err);
          }
        )
        .then((data) => {
          APP.getGifts();
          document.querySelector(".modal form").reset();
        })
        .catch((err) => {
          APP.handleError(err);
        });
    }
  },
  sendMessage(msg) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
    }
  },
  onMessage({ data }) {
    console.log("Received data:", data);
  },
  buildPeopleList: () => {
    let div = document.querySelector("section.row.people>div");
    div.innerHTML = "";
    let df = document.createDocumentFragment();
    if (div) {
      if (APP.PEOPLE.length == 0) {
        div.innerHTML = `<p class="white-text center ownerIntro">No people on the list. <br> Start to add people on your list!</p>`;
      } else {
        let listOwner = document.createElement("p");
        listOwner.innerHTML = `<p class="white-text center ownerIntro">Owner : ${APP.ownerName}</.>`;
        APP.PEOPLE.forEach((person) => {
          let dt = new Date(person.birthDate).toLocaleDateString("en-CA");
          let people_card = document.createElement("div");
          people_card.innerHTML = `<div class="card person" data-id="${person._id}">
            <div class="card-content blue-grey-text text-darken-4">
              <span class="card-title">${person.name}</span>
              <p class="dob">${dt}</p>
            </div>
            <div class="fab-anchor">
              <a class="btn-floating halfway-fab red accent-4 del-person"
                ><i class="material-icons del-person">delete</i></a>
            </div>
            <div class="card-action blue-grey darken-4">
              <a href="/pages/gifts.html" class="view-gifts white-text"
                ><i class="material-icons">playlist_add</i> View Gifts</a>
            </div>
          </div>`;
          df.append(people_card);
        });
        div.prepend(listOwner);
        div.append(df);
      }
    } else {
      APP.handleError();
    }
  },
  buildGiftList: () => {
    let div = document.querySelector("section.row.gifts>div");
    div.innerHTML = "";
    let df = document.createDocumentFragment();
    let btnBackPeoplePage = document.querySelector("#btnBackPeoplePage");
    btnBackPeoplePage.addEventListener("click", (ev) => {
      location.href = `/pages/people.html?owner=${APP.owner}`;
    });
    if (APP.GIFTS.length == 0) {
      div.innerHTML = `<p class="white-text center ownerIntro">No gift idea on the list.</p>`;
    } else {
      let giftIdea = document.createElement("div");
      giftIdea.innerHTML = `<div class="blue-grey-text text-darken-4 person-name center giftFor">
      Ideas for <span class="blue-grey-text text-darken-4">${APP.PNAME}</span></a>
      </div>`;
      let listOwner = document.createElement("p");
      listOwner.innerHTML = `<p class="white-text center giftOwner">Owner : <b>${APP.ownerName}</b></p>`;
      APP.GIFTS.forEach((gift) => {
        let gift_card = document.createElement("div");
        let url = gift.store.productURL;
        let urlStr = url;
        gift_card.innerHTML = `<div class="card gift" data-id="${gift._id}">
            <div class="card-content blue-grey-text text-darken-4">
              <h5 class="card-title idea">
                <i class="material-icons">lightbulb</i> ${gift.name}
              </h5>
              <h6 class="price"><i class="material-icons">paid</i> ${gift.price}</h6>
              <h6 class="store">
                <i class="material-icons">room</i>${gift.store.name}</h6>
              </h6>
              <h6 class="link">
                <i class="material-icons">link</i>
                <a href="${url}" class="" target="_blank">${urlStr}</a>
              </h6>
            </div>
            <div class="fab-anchor">
              <a class="btn-floating halfway-fab red accent-4 del-gift"><i class="material-icons del-gift">delete</i></a>
            </div>
          </div>`;
        df.append(gift_card);
      });
      div.prepend(listOwner);
      div.prepend(giftIdea);
      div.append(df);
    }
  },
  getPeople() {
    if (!APP.owner) return;
    let url = APP.baseURL + `api/people`;
    let options = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + APP.token,
        "x-api-key": "deje0014",
      },
    };
    fetch(url, options)
      .then(
        (resp) => {
          if (resp.ok) return resp.json();
          throw new Error(resp.statusText);
        },
        (err) => {
          APP.handleError(err);
        }
      )
      .then((data) => {
        APP.PEOPLE = data.data;
        APP.buildPeopleList();
      })
      .catch((err) => {
        APP.handleError(err);
      });
  },
  getGifts() {
    if (!APP.owner) return;
    let url = APP.baseURL + "api/people/" + APP.PID;
    let options = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + APP.token,
        "x-api-key": "deje0014",
      },
    };
    fetch(url, options)
      .then(
        (resp) => {
          if (resp.ok) return resp.json();
          throw new Error(resp.statusText);
        },
        (err) => {
          APP.handleError(err);
        }
      )
      .then((data) => {
        APP.PNAME = data.data.name;
        APP.GIFTS = data.data.gifts;
        APP.buildGiftList();
      })
      .catch((err) => {
        APP.handleError(err);
      });
  },
  handleError: (err) => {
    console.warn(err);
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
