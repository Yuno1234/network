
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("post", views.create_post, name="create_post"),
    path("post/<str:id>", views.edit_post, name="edit_post"),
    path("posts/<str:post_type>", views.load_posts, name="load_posts"),
    path("profile/<str:username>", views.load_profile, name="load_profile")
]
