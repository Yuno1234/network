import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import *


def index(request):
    return render(request, "network/index.html")


@login_required
def create_post(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    text = data.get("text", "")

    post = Post(
        user=request.user,
        text=text
    )
    post.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)


@csrf_exempt
def edit_post(request, id):
    post = Post.objects.get(id=id)
    
    if request.method == "POST":
        data = json.loads(request.body)
        text = data.get("text", "")
        post.text = text
        post.save()

        return JsonResponse({"message": "Post updated successfully."}, status=201)

    elif request.method == "PUT":
        if request.user in post.likes.all():
            post.likes.remove(request.user)
        else:
            post.likes.add(request.user)
        post.save()
        return HttpResponse(status=200)
    else:
        JsonResponse({"error": "POST or PUT request required."}, status=400)



def load_posts(request, post_type):
    page = int(request.GET.get('page'))
    results_per_page = 10
    start_index = (page - 1) * results_per_page
    end_index = start_index + results_per_page

    if post_type == "allposts":
        posts = Post.objects.all()
    elif post_type == "following":
        profile = Profile.objects.get(user=request.user)
        following = profile.following.all()
        posts = Post.objects.filter(user__in=following)
    else:
        user = User.objects.get(username=post_type)
        posts = Post.objects.filter(user=user) 

    posts = posts.order_by("-timestamp").all()
    total_posts = posts.count()
    posts = posts[start_index:end_index]
    return JsonResponse({
        "posts": [post.serialize(request) for post in posts],
        "totalPosts": total_posts
        }, safe=False)


@csrf_exempt
def load_profile(request, username):
    user = User.objects.get(username=username)
    
    if request.method == "POST":
        profile = Profile.objects.get(user=request.user)
        bio = request.POST.get('bio')
        icon = request.FILES.get('icon')
        banner = request.FILES.get('banner')

        # Update the user's profile
        profile.bio = bio
        profile.icon = icon
        profile.banner = banner
        profile.save()
 
        return HttpResponse({"message": "Profile updated successfully."}, status=202)

    elif request.method == "PUT":
        profile = Profile.objects.get(user=request.user)
        if user in profile.following.all():
            profile.following.remove(user)
        else:
            profile.following.add(user)
        profile.save()
        return HttpResponse(status=200)

    else:
        return JsonResponse({
            "profile": user.profile.serialize(request.user)
            }, safe=False)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
            profile = Profile(user = user)
            profile.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })

        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
