"""
train_model.py — PlantVillage CNN Training Script
===================================================
Trains a MobileNetV2-based classifier on the PlantVillage dataset.

Usage:
  python train_model.py --data_dir /path/to/PlantVillage --epochs 20

Dataset:  https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
Expected structure:
  data_dir/
    train/
      Tomato___Early_blight/  ← class folders
      Tomato___healthy/
      ...
    valid/
      ...
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ── Config ─────────────────────────────────────────────────────────────────────
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
MODEL_SAVE  = Path(__file__).parent / "model" / "plant_disease_model.h5"
LABELS_SAVE = Path(__file__).parent / "model" / "class_labels.json"


def build_model(num_classes: int) -> tf.keras.Model:
    """MobileNetV2 with custom classification head."""
    base_model = MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False   # freeze backbone initially

    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    return models.Model(inputs=base_model.input, outputs=outputs)


def train(data_dir: str, epochs: int, fine_tune_epochs: int):
    data_dir = Path(data_dir)
    train_dir = data_dir / "train"
    valid_dir = data_dir / "valid"

    # ── Data generators ──────────────────────────────────────────────────────
    train_gen = ImageDataGenerator(
        rescale=1.0 / 255,
        horizontal_flip=True,
        rotation_range=20,
        zoom_range=0.2,
        width_shift_range=0.1,
        height_shift_range=0.1,
        brightness_range=[0.8, 1.2],
    )
    valid_gen = ImageDataGenerator(rescale=1.0 / 255)

    train_ds = train_gen.flow_from_directory(
        train_dir, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode="categorical"
    )
    valid_ds = valid_gen.flow_from_directory(
        valid_dir, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode="categorical"
    )

    num_classes = len(train_ds.class_indices)
    print(f"Classes found: {num_classes}")

    # ── Save class labels ─────────────────────────────────────────────────────
    idx_to_class = {str(v): k for k, v in train_ds.class_indices.items()}
    LABELS_SAVE.parent.mkdir(parents=True, exist_ok=True)
    with open(LABELS_SAVE, "w") as f:
        json.dump(idx_to_class, f, indent=2)
    print(f"Class labels saved → {LABELS_SAVE}")

    # ── Build & compile ──────────────────────────────────────────────────────
    model = build_model(num_classes)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks = [
        ModelCheckpoint(str(MODEL_SAVE), save_best_only=True, monitor="val_accuracy", verbose=1),
        EarlyStopping(patience=5, restore_best_weights=True),
        ReduceLROnPlateau(factor=0.5, patience=3, verbose=1),
    ]

    # ── Phase 1: Train head ───────────────────────────────────────────────────
    print("\n── Phase 1: Training classification head ──")
    model.fit(train_ds, validation_data=valid_ds, epochs=epochs, callbacks=callbacks)

    # ── Phase 2: Fine-tune top layers ────────────────────────────────────────
    print(f"\n── Phase 2: Fine-tuning last 30 layers for {fine_tune_epochs} epochs ──")
    base = model.layers[0]   # MobileNetV2
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=valid_ds, epochs=fine_tune_epochs, callbacks=callbacks)

    print(f"\nModel saved → {MODEL_SAVE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Plant Disease Classifier")
    parser.add_argument("--data_dir",        required=True, help="Path to dataset root")
    parser.add_argument("--epochs",          type=int, default=15, help="Head training epochs")
    parser.add_argument("--fine_tune_epochs",type=int, default=10, help="Fine-tune epochs")
    args = parser.parse_args()

    train(args.data_dir, args.epochs, args.fine_tune_epochs)
