package com.example.objectdetection;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class MainActivity extends AppCompatActivity {

    public static final int REQUEST_IMAGE_CAPTURE = 100;
    public static final int CAMERA_PERMISSION_REQUEST_CODE = 1000;
    public static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

    private Button launchCameraButton;
    private ImageView imageView;
    private Bitmap image;
    private LocationManager locationManager;
    private double longitude;
    private double latitude;

    private DatabaseReference mainRef;
    private StorageReference storage;
    private FirebaseAuth auth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mainRef = FirebaseDatabase.getInstance().getReference();
        storage = FirebaseStorage.getInstance().getReference();
        auth = FirebaseAuth.getInstance();

        launchCameraButton = findViewById(R.id.launch_camera_button);
        imageView = findViewById(R.id.imageView);

        launchCameraButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                            checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                        launchCamera();
                    } else {
                        String[] permissionRequest = {Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE};
                        requestPermissions(permissionRequest, CAMERA_PERMISSION_REQUEST_CODE);
                    }
                }
            }
        });
    }

    public void launchCamera() {
        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (cameraIntent.resolveActivity(getPackageManager()) != null) {
            startActivityForResult(cameraIntent, REQUEST_IMAGE_CAPTURE);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
            image = (Bitmap) data.getExtras().get("data");
            imageView.setImageBitmap(image);
            encodeAndUploadBitmap();
        }
    }

    private void encodeAndUploadBitmap() {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        image.compress(Bitmap.CompressFormat.PNG, 100, baos);
        byte[] imageBytes = baos.toByteArray();

        final StorageReference imageRef = storage.child("images").child(getPictureName());
        UploadTask imageUploadTask = imageRef.putBytes(imageBytes);
        imageUploadTask.addOnCompleteListener(new OnCompleteListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onComplete(@NonNull Task<UploadTask.TaskSnapshot> task) {
                Toast.makeText(MainActivity.this, "In the task", Toast.LENGTH_SHORT).show();
                if (task.isSuccessful()) {
                    imageRef.getDownloadUrl().addOnCompleteListener(new OnCompleteListener<Uri>() {
                        @Override
                        public void onComplete(@NonNull Task<Uri> task) {
                            Log.i("Location", "onComplete: 2");
                            if (task.isSuccessful()) {
                                String downloadUrl = task.getResult().toString();

                                String imageKey = mainRef.child("tempimgs").push().getKey();
                                Map imageDetails = new HashMap();
                                imageDetails.put("location/latitude", latitude);
                                imageDetails.put("location/longitude", longitude);
                                imageDetails.put("downloadUrl", downloadUrl);
                                mainRef.child("tempimgs").child(imageKey).updateChildren(imageDetails);
                            }
                        }
                    });
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case CAMERA_PERMISSION_REQUEST_CODE:
                boolean cameraPermissionsGranted = checkPermissions(grantResults);
                if (cameraPermissionsGranted) {
                    launchCamera();
                } else {
                    Toast.makeText(this, "Can't use camera without permission.", Toast.LENGTH_SHORT).show();
                }
                break;
        }
    }

    private boolean checkPermissions(int[] grantResults) {
        boolean permissionsGranted = true;
        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                permissionsGranted = false;
                break;
            }
        }

        return permissionsGranted;
    }


    private String getPictureName() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.CANADA);
        String timestamp = sdf.format(new Date());
        return "IMG_" + timestamp + ".png";
    }
}
