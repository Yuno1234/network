from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    pass
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.CharField(null=True, blank=True, max_length=160)
    icon = models.ImageField(null=True, blank=True, upload_to='network/static/network/user_image/icon')
    banner = models.ImageField(null=True, blank=True, upload_to='　')
    following = models.ManyToManyField(User, blank=True, related_name="followers") 

    def serialize(self, user):
        return {
            "user": self.user.username,
            "joined":self.user.date_joined.strftime("%b %d %Y"),
            "bio": self.bio,
            "icon": self.icon.url if self.icon else None,
            "banner": self.banner.url if self.banner else None,
            "following": self.following.count(),
            "followers": self.user.followers.count(),
            "is_following": (not user.is_anonymous) and self.user in user.profile.following.all(),
            "follow_available": (not user.is_anonymous) and self.user != user
        }

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    timestamp = models.DateTimeField(default=timezone.now)
    text = models.CharField(max_length=280)
    likes = models.ManyToManyField(User, blank=True, related_name="liked_posts")

    def serialize(self, request):
        return {
            "id": self.id,
            "user": self.user.username,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "text": self.text,
            "likes": self.likes.count(),
            "liked": request.user in self.likes.all(),
            "editable": self.user == request.user
        }
