const isAuthorized = document.getElementById('is-authorized').value === 'True';
let allPosts = document.querySelector('#all-posts');
let following = document.querySelector('#following');
let profile = document.querySelector('#profile');

let topTitle = document.querySelector('#top-title');
let indexPostForm = document.querySelector('.index-post-form')
let postForm = document.querySelector('#post-form');

let profileView = document.querySelector('#profile-view');
let editProfileForm = document.querySelector('#modal-overlay')

let postsView = document.querySelector('#posts-view');
let template = document.querySelector('#post-template')


if (!isAuthorized) {
    // User is not authorized
    document.addEventListener('DOMContentLoaded', () => {
        indexPostForm.style.display = 'none';
        profileView.style.display = 'none';
        loadPosts('allposts')
        topTitle.innerText = "All Posts"
    })
} else {
    // User is authorized
    document.addEventListener('DOMContentLoaded', () => {
        indexPostForm.style.display = 'block';
        profileView.style.display = 'none';
        loadPosts('allposts')
        topTitle.innerText = "All Posts"
    })

    allPosts.addEventListener('click', () => {
        indexPostForm.style.display = 'block';
        profileView.style.display = 'none';
        loadPosts('allposts')
        topTitle.innerText = "All Posts"
    })

    following.addEventListener('click', () => {
        indexPostForm.style.display = 'none';
        profileView.style.display = 'none';
        loadPosts('following')
        topTitle.innerText = "Following"
    })

    profile.addEventListener('click', () => {
        indexPostForm.style.display = 'none';
        profileView.style.display = 'block';
        loadPosts(profile.dataset.user)
        loadProfile(profile.dataset.user)
        topTitle.innerText = "Profile"
    })

    postForm.onsubmit = create_post;
}


function create_post(event) {
    event.preventDefault();
    let element = postForm.elements;
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

    fetch('/post', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            text: element.text.value
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        element.text.value = '';
        setTimeout(function () { loadPosts('allposts'); }, 100)
    });
}


function loadPosts(postType, page) {
    postsView.innerHTML = ''
    page = page ? page : 1
    fetch(`posts/${postType}?page=${page}`)
    .then(response => response.json())
    .then(result => {
        console.log(result)
        result.posts.forEach((post) => {
            const templateClone = template.content.cloneNode(true);

            const postItem = templateClone.querySelector('.post');
            const username = templateClone.querySelector('.post-username');
            const timestamp = templateClone.querySelector('.post-timestamp');
            const text = templateClone.querySelector('.post-text');
            let likeBtn = templateClone.querySelector(".like-btn");
            let likeIcon = templateClone.querySelector(".like-icon");
            const likes = templateClone.querySelector('.post-likes');

            postItem.dataset.postId = post.id;
            username.innerText = post.user;
            timestamp.innerText = post.timestamp;
            text.innerText = post.text;
            likes.innerText = post.likes;
            likeBtn.className = post.liked ? 'like-btn active' : 'like-btn'

            username.addEventListener('click', () => {
                indexPostForm.style.display = 'none';
                profileView.style.display = 'block';

                loadProfile(post.user)
                loadPosts(post.user)
            })

            if (isAuthorized) {
                likeBtn.addEventListener('click', (event)=>{
                    event.preventDefault();
                    likeBtn.classList.toggle("active");
                    like(post.id)
                    if(likeBtn.classList.contains("active")){
                        createClones(likeBtn, likeIcon);
                        likes.innerText++;
                    } else {
                        likes.innerText--;
                    }
                });

                if (post.editable) {
                    const editPostBtn = document.createElement('button')
                    editPostBtn.innerText = 'Edit'
                    editPostBtn.className = 'edit-post-btn'
                    editPostBtn.addEventListener('click', () => editPost(post))
                    templateClone.querySelector('.post-info').append(editPostBtn)
                }
            }
            postsView.append(postItem);
        })
        createPagination(postType, result.totalPosts, page)
    })
}
                        

function createPagination(postType, totalPosts, pageNum) {
    const numPages = Math.ceil(totalPosts / 10);
    let paginationHtml = '<ul class="pagination justify-content-center pt-5 pb-4">';

    for (let i = 1; i <= numPages; i++) {
        paginationHtml += ` 
        <li class="page-item">
            <a href="#" class="page-link" data-page="${i}">${i}</a>
        </li>
        `;
    }
    paginationHtml += '</ul>';
    document.querySelector('#pagination-container').innerHTML = paginationHtml;

    let pageListItem = document.querySelector(`[data-page="${pageNum}"]`).parentNode
    pageListItem.classList.add("active")
    
    const pageLinks = document.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = event.target.dataset.page;
            loadPosts(postType, page);
        });
    });
}


function loadProfile(username) {
    fetch(`profile/${username}`)
        .then(response => response.json())
        .then(result => {
            console.log(result)

            document.querySelector('#profile-username').innerText = result.profile.user
            document.querySelector('#profile-bio').innerText = result.profile.bio
            document.querySelector('#profile-joined').innerText = result.profile.joined
            document.querySelector('#profile-following').innerText = result.profile.following
            document.querySelector('#profile-followers').innerText = result.profile.followers
            document.querySelector('#profile-banner > img').src = result.profile.banner ? result.profile.banner.replace('/network/static', 'static') : null
            document.querySelector('#profile-user-icon > img').src = result.profile.icon ? result.profile.icon.replace('/network/static', 'static') : 'static/network/image/default_user_icon.png'
            document.querySelector('#profile-buttons').innerHTML = ''

            if (isAuthorized) {
                if (result.profile.follow_available) {
                    const followBtn = document.createElement('button');
                    followBtn.innerText = result.profile.is_following ? 'Following' : 'Follow'
                    followBtn.className = result.profile.is_following ? 'follow-btn following' : 'follow-btn'
                    followBtn.addEventListener('click', () => {
                        follow(result.profile.user)
                        followBtn.classList.toggle('following')
                        if (followBtn.innerText === 'Follow') {
                            followBtn.innerText = 'Following'
                            result.profile.followers += 1
                        } else {
                            followBtn.innerText = 'Follow'
                            result.profile.followers -= 1
                        }
                        document.querySelector('#profile-followers').innerText = result.profile.followers
                    })
                    document.querySelector('#profile-buttons').append(followBtn)
                } else {
                    const editProfileBtn = document.createElement('button');
                    editProfileBtn.innerText = 'Edit Profile';
                    editProfileBtn.className = 'edit-profile-btn';
                    editProfileBtn.addEventListener('click', () => {
                        editProfile(result.profile.user)
                    })
                    document.querySelector('#profile-buttons').append(editProfileBtn)
                }
            } else {
                document.querySelector('#profile-content').style.paddingTop = "75px"
            }
        })
}


function follow(username) {
    fetch(`profile/${username}`, {
        method: 'PUT',
        body: JSON.stringify({
            username: username
        })
    })
}


function editPost(post) {
    const postContent = document.querySelector(`[data-post-id="${post.id}"] .post-content`);
    postContent.innerHTML = `
    <textarea 
    name="text" 
    class="form-control col-11"
    rows="1"
    maxlength="280"
    oninput='this.style.height = "";this.style.height = this.scrollHeight + "px"'
    style="margin: 0.5rem auto; font-size: 1.2rem;"
    placeholder="What's happening?">${post.text}</textarea>
    `;

    const updateBtn = document.createElement('button');
    updateBtn.className = 'post-edit-submit';
    updateBtn.type = "button";
    updateBtn.innerText = 'Update';
    updateBtn.addEventListener('click', () => {
    const newContent = postContent.querySelector('textarea').value;
        fetch(`post/${post.id}`, {
            method: 'POST',
            body: JSON.stringify({
                text: newContent
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            postContent.innerHTML = `<p>${newContent}</p>`
        });
    })
    postContent.append(updateBtn)
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'post-cancel-submit';
    cancelBtn.type = "button";
    cancelBtn.innerText = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        postContent.innerHTML = `<p>${post.text}</p>`
    })
    postContent.append(cancelBtn)
}


function editProfile(username) {
    document.querySelector('#bio-input').value = '';
    document.querySelector('#icon-file-input').value = '';
    document.querySelector('#banner-file-input').value = '';

    editProfileForm.style.display = 'block'
    document.querySelector('#edit-profile-buttons').innerHTML = `
    <button class="profile-cancel-submit">Cancel</button>
    <input class="btn profile-submit" type="submit" value="Update Profile">`

    document.querySelector('.profile-cancel-submit').addEventListener('click', (event) => {
        event.preventDefault()
        editProfileForm.style.display = 'none'
        console.log("cancel")
    })

    document.querySelector('.profile-submit').addEventListener('click', (event) => {
        event.preventDefault()
        editProfileForm.style.display = 'none'
        updateProfile(username)
        console.log("submit")
    })
}


function updateProfile(username) {

    const bioInput = document.querySelector('#bio-input');
    const iconFileInput = document.querySelector('#icon-file-input');
    const bannerFileInput = document.querySelector('#banner-file-input');

    const formData = new FormData();
    formData.append('bio', bioInput.value)
    formData.append('icon', iconFileInput.files[0]);
    formData.append('banner', bannerFileInput.files[0]);
    console.log(formData)

    fetch(`profile/${username}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    });
}


function like(post_id) {
    fetch(`post/${post_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            id: post_id
        })
    })
}

function randomNum(min, max) {
    return Math.floor(Math.random()*(max- min + 1 )+ min);
}
  
function negativePositve() {
    return Math.random() <0.5 ? -1 : 1;
}
  
function createClones(button, icon) {
    let numberOfClones = randomNum(3, 5);

    for(let i=1; i<= numberOfClones; i++) {
        let clone = icon.cloneNode(true);
        let size = randomNum(8, 15);
        button.appendChild(clone);
        clone.setAttribute("width", size);
        clone.setAttribute("height", size);
        clone.classList.add("clone");
        clone.style.transform = 
        "translate(" + 
        negativePositve() * randomNum(15, 30) + "px," +
        negativePositve() * randomNum(15, 30) + "px)";

        let removeNode = setTimeout(() =>{
        button.removeChild(clone);
        clearTimeout(removeNode);
        }, 800);
    }
}