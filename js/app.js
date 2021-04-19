const APP = {
  baseURL: "http://giftr-api-elb2-1386159590.us-east-1.elb.amazonaws.com/",
  OWNERKEY: "giftr-<Gyuyoung-Lee/Alessandro-deJesus>-owner",
  token: sessionStorage.getItem("token"),
  owner: null,
  ownerName: null,
  GIFTS: [],
  PEOPLE: [],
  PID: null,
  PNAME: null,
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
    console.log("A page is loaded and checking", location.search);
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
    console.log(APP.page, "adding listeners");
    //HOME PAGE
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
          console.warn("No email address");
        }
      });
    }
    //FORGOTPWD PAGE
    if (APP.page === "forgotPwd") {
      let btnUpdatePwd = document.getElementById("btnUpdatePwd");
      btnUpdatePwd.addEventListener("click", (ev) => {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        let payload = { emailAddress: email, pass: password };
        if (payload) {
          APP.updatePwd(payload);
        }
      });
    }
    //REGISTER PAGE
    if (APP.page === "register") {
      let btnReg = document.getElementById("btnRegister");
      btnReg.addEventListener("click", (ev) => {
        let firstName = document.getElementById("firstName").value;
        let lastName = document.getElementById("lastName").value;
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        let payload = { first: firstName, last: lastName, emailAddress: email, pass: password };
        if (payload) {
          APP.registerUser(payload);
        }
      });
    }

    //PEOPLE PAGE
    if (APP.page === "people") {
      //activate the add person modal
      let elemsP = document.querySelectorAll(".modal");
      let instancesP = M.Modal.init(elemsP, { dismissable: true });
      //activate the slide out for logout
      let elemsL = document.querySelectorAll(".sidenav");
      let instancesL = M.Sidenav.init(elemsL, {
        edge: "left",
        draggable: true,
      });

      //add person listener
      let btnSave = document.getElementById("btnSavePerson");
      btnSave.addEventListener("click", APP.addPerson);
      //TODO:
      //delete person listener TODO: Add a confirmation for delete
      //plus same listener for view gifts listener
      let section = document.querySelector(`section.people`);
      section.addEventListener("click", APP.delOrViewPerson);
      //stop form submissions
      document.querySelector("#modalAddPerson form").addEventListener("submit", (ev) => {
        ev.preventDefault();
      });
      let btnLogOut = document.querySelector("#btnLogOut");
      btnLogOut.addEventListener("click", (ev) => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("ownerName");
        sessionStorage.removeItem(APP.OWNERKEY);
      });
      let btnForgotPwd = document.querySelector("#btnForgotPwd");
      btnForgotPwd.addEventListener("click", (ev) => {
        location.href = "forgotPwd.html";
      });
    }
    //GIFTS PAGE
    if (APP.page === "gifts") {
      //activate the add gift modal
      let elemsG = document.querySelectorAll(".modal");
      let instancesG = M.Modal.init(elemsG, { dismissable: true });
      //activate the slide out for logout
      let elemsL = document.querySelectorAll(".sidenav");
      let instancesL = M.Sidenav.init(elemsL, {
        edge: "left",
        draggable: true,
      });

      //add gift listener
      let btnSave = document.getElementById("btnSaveGift");
      btnSave.addEventListener("click", APP.addGift);
      //TODO:
      //delete gift listener TODO: Add confirmation for delete
      let section = document.querySelector(`section.gifts`);
      section.addEventListener("click", APP.delGift);
      //stop form submissions
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
        console.log("This is the token", data["data"].token);
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
          //failed to fetch user
          console.warn({ err });
        }
      )
      .then((data) => {
        //TODO: do the user validation in the API
        console.log(data);
        // let user = data.filter((user) => user.email === email);
        APP.owner = data["data"]._id;
        sessionStorage.setItem(APP.OWNERKEY, APP.owner);
        console.log("logged in... go to people page");
        APP.ownerName = data.data.firstName + " " + data.data.lastName;
        sessionStorage.setItem("ownerName", APP.ownerName);
        location.href = `/pages/people.html?owner=${APP.owner}`;
      })
      .catch((err) => {
        //TODO: global error handler function
        APP.handleError(err);
      });
  },
  registerUser: (payload) => {
    // email, password, firstName, lastName
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
        console.log(data);
        sessionStorage.removeItem("token");
        sessionStorage.setItem("token", data.token);
        // sessionStorage.removeItem("ownerName");
        // sessionStorage.removeItem(APP.OWNERKEY);
      })
      .catch((err) => console.warn(err));
  },
  delGift(ev) {
    ev.preventDefault();
    console.log(ev.target);
    let btn = ev.target;
    if (btn.classList.contains("del-gift")) {
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      //TODO: remove from DB by calling API
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
          console.log(data);
          console.log(APP.GIFTS);
          APP.GIFTS = APP.GIFTS.filter((gift) => {
            return gift._id != id;
          });
          APP.buildGiftList();
        })
        .catch((err) => console.warn(err));
    }
  },
  delOrViewPerson(ev) {
    ev.preventDefault(); //stop the anchor from leaving the page
    console.log(ev.target);
    let btn = ev.target;
    if (btn.classList.contains("del-person")) {
      //delete a person
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      //TODO: remove from DB by calling API
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
          console.log(APP.PEOPLE);
          console.log(data);

          APP.PEOPLE = APP.PEOPLE.filter((person) => {
            return person._id != data.data._id;
          });
          console.log("after filter", APP.PEOPLE);
          APP.buildPeopleList();
        })
        .catch((err) => console.warn(err));
    }
    if (btn.classList.contains("view-gifts")) {
      console.log("go view gifts");
      //go see the gifts for this person
      let id = btn.closest(".card[data-id]").getAttribute("data-id");
      //we can pass person_id by sessionStorage or queryString or history.state ?
      let url = `/pages/gifts.html?owner=${APP.owner}&pid=${id}`;
      location.href = url;
    }
  },
  addPerson(ev) {
    //user clicked the save person button in the modal
    ev.preventDefault();
    let name = document.getElementById("name").value;
    let dob = document.getElementById("dob").value;
    let birthDate = new Date(dob).valueOf();
    if (name.trim() && birthDate) {
      console.log(name, dob);
      //TODO: actually send this to the API for saving
      //TODO: let the API create the _id
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
            //failed to fetch user
            console.warn({ err });
          }
        )
        .then((data) => {
          console.log("Added person", data);
          console.log("saved..", data.data);
          APP.PEOPLE.push(data.data);
          console.log(APP.PEOPLE);
          APP.buildPeopleList();
          document.querySelector(".modal form").reset();
        })
        .catch((err) => {
          //TODO: global error handler function
          APP.handleError(err);
        });
    }
  },
  addGift(ev) {
    //user clicked the save gift button in the modal
    ev.preventDefault();
    let name = document.getElementById("name").value;
    let price = document.getElementById("price").value;
    let storeName = document.getElementById("storeName").value;
    let storeProductURL = document.getElementById("storeProductURL").value;
    //TODO: make all 4 fields required_DONE
    //TODO: check for valid URL if provided
    //TODO: provide error messages to user about invalid prices and urls
    if (name.trim() && !isNaN(price) && storeName.trim() && storeProductURL.trim()) {
      let gift = {
        name,
        price,
        store: {
          name: storeName,
          productURL: storeProductURL,
        },
      };
      console.log("gift", gift);
      //add the gift to the current person
      //TODO: Actually send this to the API instead of just updating the array
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
            //failed to fetch user
            APP.handleError(err);
          }
        )
        .then((data) => {
          console.log("Added gift", data);
          // let idx = data.data.gifts.length;
          // APP.GIFTS.push(data.data.gifts[idx - 1]);
          // console.log("after pushed gifts to gift", APP.GIFTS);
          // APP.PNAME = data.data.name;
          // APP.buildGiftList();
          APP.getGifts();
          document.querySelector(".modal form").reset();
        })
        .catch((err) => {
          //TODO: global error handler function
          APP.handleError(err);
        });
    }
  },
  sendMessage(msg, target) {
    //TODO:
    //send a message to the service worker
  },
  onMessage({ data }) {
    //TODO:
    //message received from service worker
  },
  buildPeopleList: () => {
    let div = document.querySelector("section.row.people>div");
    div.innerHTML = "";
    let df = document.createDocumentFragment();
    if (div) {
      //TODO: add handling for null and undefined or missing values
      //TODO: display message if there are no people
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
      //TODO: error message
      APP.handleError();
    }
  },
  buildGiftList: () => {
    let div = document.querySelector("section.row.gifts>div");
    div.innerHTML = "";
    let df = document.createDocumentFragment();
    if (div) {
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
          //TODO: add handling for null and undefined or missing values
          //TODO: check for a valid URL before setting an href
          let gift_card = document.createElement("div");
          let url = gift.store.productURL;
          let urlStr = url;
          // try {
          // url = new URL(url);
          // urlStr = url;
          // } catch (err) {
          // if (err.name == "TypeError") {
          // not a valid url
          // url = "";
          // urlStr = "No valid URL provided";
          // }
          // }
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
    } else {
      //TODO: error message
      APP.handleError();
    }
  },
  getPeople() {
    //TODO:
    //get the list of all people for the user_id
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
        //TODO: filter this on the serverside NOT here
        console.log(data);
        APP.PEOPLE = data.data;
        console.log("new app.people", APP.PEOPLE);
        APP.buildPeopleList();
      })
      .catch((err) => {
        //TODO: global error handler function
        APP.handleError(err);
      });
  },
  getGifts() {
    // APP.buildGiftList();
    //TODO:
    //get the list of all the gifts for the person_id and user_id
    if (!APP.owner) return;
    // TODO: use a valid URL and queryString for your API
    // let url = `${APP.baseURL}people.json?owner=${APP.owner}&pid=${APP.PID}`;
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
        // TODO: filter this on the serverside NOT here
        // let peeps = data.people.filter((person) => person.owner == APP.owner);
        // TODO: match the person id with the one from the querystring
        // let person = peeps.filter((person) => person._id == APP.PID);
        // APP.PNAME = person[0].name;
        // APP.GIFTS = person[0].gifts; //person is an array from filter()
        console.log(data);
        APP.PNAME = data.data.name;
        APP.GIFTS = data.data.gifts;
        APP.buildGiftList();
      })
      .catch((err) => {
        // TODO: global error handler function
        APP.handleError(err);
      });
  },
  handleError: (err) => {
    console.warn(err);
    // removed window.alert. TODO: check if other alert should be added.
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
