/**
 * Module dependencies
 */

var express = require("express"),
    http    = require("http"),
    request = require("superagent"),
    apiKey  = "0c44fb117d7bd73930e98632f6a633a1", 
    server,
    app,
    io,
    currentSong,
    dj,
    client  = __dirname + "/../client";

/**
 * Create app
 */
app = express();

app.get("/", function (req, res) {
    console.log("user " + req.query.user_id + " join from " + req.query.referrer);
    res.cookie("userId", req.query.user_id, { maxAge: 900000 });
    res.redirect(301, "/index.html?uid=" + req.query.user_id);
    //res.send("<script>document.location.href = '/index.html?userId=" + req.query.user_id + "';</script>");
});

app.use(express.static(client));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "/" }));

server = http.createServer(app);

io = require("socket.io").listen(server);

function elect(socket) {
    dj = socket;

    io.sockets.emit("announcement", socket.nickname + " is the new dj");
    socket.emit("elected");
    socket.dj = true;

    socket.on("disconnect", function () {
        dj = null;
        io.sockets.emit("announcement", "the dj left - next one to join becomes dj");
    });
}

io.sockets.on("connection", function (socket) {
    socket.on("join", function (name) {
        socket.nickname = name;
        socket.broadcast.emit("announcement", name + " joined the chat.");

        if (!dj) {
            elect(socket);
        } else {
            socket.emit("song", currentSong);
        }
    });

    socket.on("text", function (msg, fn) {
        socket.broadcast.emit("text", socket.nickname, msg);
        if (typeof fn === "function") {
            fn(Date.now());
        }
    });

    socket.on("search", function (q, fn) {
        request("http://tinysong.com/s/" + encodeURIComponent(q) + "?key=" + apiKey + "&format=json", function (res) {
            if (res.status === 200) {
                fn(JSON.parse(res.text));
            }
        });
    });

    socket.on("song", function (song) {
        if (socket.dj) {
            currentSong = song;
            socket.broadcast.emit("song", song);
        }
    });
});

/**
 * Listen
 */
server.listen(3000);
