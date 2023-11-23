/*JavaScript code that records audio until the user presses a button provided on the HTML page. The user presses the same button to start the recording. The button connects the user’s machine microphone, switching it on:
*/
// Replace with your own subscription key and region
const subscriptionKey = 'YOUR_SUBSCRIPTION_KEY';
const region = 'YOUR_REGION';

// Get an authentication token
const tokenEndpoint = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
const tokenRequest = new XMLHttpRequest();
tokenRequest.open('POST', tokenEndpoint, true);
tokenRequest.setRequestHeader('Ocp-Apim-Subscription-Key', subscriptionKey);
tokenRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
tokenRequest.onload = function () {
    const token = this.responseText;
    console.log('Got an authentication token: ' + token);

    // Send audio to the Speech-to-Text REST API
    const speechEndpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    const speechRequest = new XMLHttpRequest();
    speechRequest.open('POST', speechEndpoint, true);
    speechRequest.setRequestHeader('Authorization', 'Bearer ' + token);
    speechRequest.setRequestHeader('Content-type', 'audio/wav; codec=audio/pcm; samplerate=16000');
    speechRequest.onload = function () {
        const response = JSON.parse(this.responseText);
        const text = response.DisplayText;
        console.log('Transcribed text: ' + text);

        // Save the transcribed text to a file
        const filename = `transcription_${new Date().toISOString()}.txt`;
        const fileContent = `Source language: ${response.Language}\nTranslated language: ${response.Translation}\nTimestamp: ${new Date().toISOString()}\nTranscribed text: ${text}`;
        const file = new Blob([fileContent], { type: 'text/plain' });
        const fileUrl = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename;
        link.click();
    };

    // Start recording audio from the microphone
    const mediaConstraints = {
        audio: true
    };
    let mediaRecorder;
    let chunks = [];
    let isRecording = false;
    const startRecordingButton = document.getElementById('start-recording-button');
    const stopRecordingButton = document.getElementById('stop-recording-button');
    startRecordingButton.addEventListener('click', function () {
        navigator.mediaDevices.getUserMedia(mediaConstraints).then(function (stream) {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.addEventListener('dataavailable', function (event) {
                chunks.push(event.data);
            });
            mediaRecorder.addEventListener('stop', function () {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                chunks = [];
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    const base64data = reader.result.split(',')[1];
                    const binaryData = atob(base64data);
                    const audioData = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        audioData[i] = binaryData.charCodeAt(i);
                    }
                    speechRequest.send(audioData);
                };
            });
            mediaRecorder.start();
            isRecording = true;
            startRecordingButton.disabled = true;
            stopRecordingButton.disabled = false;
        });
    });
    stopRecordingButton.addEventListener('click', function () {
        if (isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            startRecordingButton.disabled = false;
            stopRecordingButton.disabled = true;
        }
    });
};
tokenRequest.send();
