const clientID = "*******************";
const redirectURI = "https://jamming-armin.surge.sh";
let UAT;
export const Spotify = {
    getUAT() {
        if (UAT) return UAT;

        // Check for UAT match
        const accessTokenMatch =
            window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            UAT = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);

            window.setTimeout(() => (UAT = ""), expiresIn * 1000);
            window.history.pushState("Access Token", null, "/");
        } else {
            const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
            window.location = accessURL;
        }
    },

    search(term) {
        const accessToken = Spotify.getUAT();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then(response => {
                return response.json();
            })
            .then(jsonResponse => {
                if (!jsonResponse.tracks) {
                    return [];
                }
                return jsonResponse.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri,
                }));
            });
    },

    savePlaylist(name, trackURIs) {
        if (!name || !trackURIs.length) {
            return;
        }

        const accessToken = Spotify.getUAT();
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };
        let userID;

        return fetch("https://api.spotify.com/v1/me", { headers: headers })
            .then(response => response.json())
            .then(jsonResponse => {
                userID = jsonResponse.id;
                return fetch(
                    `https://api.spotify.com/v1/users/${userID}/playlists`,
                    {
                        headers: headers,
                        method: "POST",
                        body: JSON.stringify({ name: name }),
                    }
                )
                    .then(response => response.json())
                    .then(jsonResponse => {
                        const playlistID = jsonResponse.id;
                        return fetch(
                            `https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`,
                            {
                                headers: headers,
                                method: "POST",
                                body: JSON.stringify({ uris: trackURIs }),
                            }
                        );
                    });
            });
    },
};
