import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const demosSection = document.getElementById("demos");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "540px";
const videoWidth = "720px";

const baseUrl = "https://6561942edcd355c08323f465.mockapi.io/api/v1/photos/";

const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
  });
  demosSection.classList.remove("invisible");
};
createGestureRecognizer();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const imgs = document.querySelector(".imgs");
const canvas = document.getElementById("capture-canvas");
const status = document.querySelector(".status");
const light = document.querySelector(".light");
const share = document.querySelector("#share");

if (localStorage.getItem("share") == null) {
  localStorage.setItem("share", 1);
}

share.addEventListener("change", () => {
  if (localStorage.getItem("share") == 1) {
    localStorage.setItem("share", 0);
  } else {
    localStorage.setItem("share", 1);
  }
  console.log("Changed");
});

if (localStorage.getItem("share") == 1) {
  share.checked = true;
} else {
  share.checked = false;
}

status.textContent = "If You Ready, Show🤚";

const constraintsC = {
  video: {
    width: 720,
    height: 540,
  },
};

canvas.width = constraintsC.video.width;
canvas.height = constraintsC.video.height;

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", () => {
    enableCam();
    canvasElement.style.display = "block";
  });
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }
  // getUsermedia parameters.
  const constraints = {
    video: {
      width: 720,
      height: 540,
    },
  };
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    window.stream = stream;
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}
let lastVideoTime = -1;
let results = undefined;
let capture = false;
let wait = 0;
var context = canvas.getContext("2d");

const Capture = () => {
  if (webcamRunning == true) {
    context.drawImage(
      video,
      0,
      0,
      constraintsC.video.width,
      constraintsC.video.height
    );
    let new_image_url = context.canvas.toDataURL("image/jpeg", 90);

    const photo = {
      link: new_image_url,
    };
    if (localStorage.getItem("share") == 1) {
      fetch(baseUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Send your data in the request body as JSON
        body: JSON.stringify(photo),
      }).then((res) => {
        if (res.ok) {
          return res.json();
        }
      });
    }
    let img = document.createElement("img");
    img.src = new_image_url;
    imgs.appendChild(img);
    document.querySelector("#capture-audio").play()
    status.textContent = "Well👍";
    lightOff();
    setTimeout(resetSatus, 1000);
    console.log("CAPTURED!");
  }
};

let hotkey = false;
document.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key == "F8" && !hotkey) {
    hotkey = true;
    console.log("YEEEEEEEEEEES!");
  } else if (e.key == "p") {
    hotkey = false;
    loadPhoto();
  }
});

function lightOn() {
  light.classList.remove("removed");
}

function lightOff() {
  light.classList.add("removed");
}

function resetSatus() {
  status.textContent = "If You Ready, Show🤚";
}

async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }
  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);
  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
  }
  canvasCtx.restore();
  if (results.gestures.length > 0) {
    gestureOutput.style.display = "block";
    gestureOutput.style.width = `${+videoWidth.replace("px", "") / 1.015}px`;
    const categoryName = results.gestures[0][0].categoryName;
    let gesture = categoryName;
    if (categoryName == "None") {
      gesture = "None⛔";
    } else if (categoryName == "Closed_Fist") {
      gesture = "Closed Fist✊";
    } else if (categoryName == "Open_Palm") {
      gesture = "Open Palm🤚";
    } else if (categoryName == "Pointing_Up") {
      gesture = "☝️";
    } else if (categoryName == "Thumb_Down") {
      gesture = "👎";
      document.querySelector("#screammer").play()
    } else if (categoryName == "Thumb_Up") {
      gesture = "👍";
    } else if (categoryName == "Victory") {
      gesture = "✌️";
    } else if (categoryName == "ILoveYou") {
      gesture = "🤟";
    }
    gestureOutput.innerText = gesture;
    if (categoryName == "Open_Palm" && !capture) {
      capture = true;
      clearTimeout(resetSatus);
      status.textContent = "To Take Picture, Show✊";
      wait = 0;
    } else if (categoryName == "Closed_Fist" && capture) {
      clearTimeout(resetSatus);
      status.textContent = "3 seconds";
      setTimeout(lightOn, 2000);
      setTimeout(Capture, 3000);
      capture = false;
      wait = 0;
    } else if (wait >= 10) {
      capture = false;
      resetSatus();
      console.log("CANCELED!");
      wait = 0;
    } else if (
      categoryName != "Closed_Fist" &&
      categoryName != "Open_Palm" &&
      capture
    ) {
      wait++;
    }
    console.log(wait);
    // console.log(categoryName + "\nWAIT: " + wait)
  } else {
    gestureOutput.style.display = "none";
  }
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
